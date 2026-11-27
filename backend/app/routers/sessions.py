import json
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..models import Character, Session, Message
from ..schemas import SessionCreateIn, SessionOut, MessageIn, MessageOut, ChatMessageOut
from ..deepseek import call_deepseek, DeepSeekError
from ..prompts import chat_system_prompt
from ..auth import get_current_user
from ..models import User
from ..achievements import check_and_award_achievements


router = APIRouter(prefix="/api/sessions", tags=["sessions"])
MAX_ENGAGEMENT = 20
MAX_TURNS = 25


async def _load_session(db: AsyncSession, session_id: int) -> Session | None:
    res = await db.execute(
        select(Session).options(selectinload(Session.character)).where(Session.id == session_id)
    )
    return res.scalar_one_or_none()


@router.post("", response_model=SessionOut)
async def create_session(payload: SessionCreateIn, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    char = await db.get(Character, payload.character_id)
    if not char:
        raise HTTPException(404, "Character not found")

    session = Session(
        user_id=current_user.id,
        character_id=char.id,
        player_name=payload.player.name,
        player_age=payload.player.age,
        player_height=payload.player.height,
        player_weight=payload.player.weight,
        player_attractiveness=payload.player.attractiveness,
        player_intelligence=payload.player.intelligence,
        total_score=0,
        engagement=char.initial_patience,
        turn_count=0,
        status="active",
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    db.add(Message(
        session_id=session.id, role="assistant",
        content=f"Привет 🙂 Я {char.name}. Как тебя зовут?",
    ))
    await db.commit()

    session = await _load_session(db, session.id)
    return session


@router.get("/{session_id}", response_model=SessionOut)
async def get_session(session_id: int, db: AsyncSession = Depends(get_db)):
    session = await _load_session(db, session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    return session


@router.get("/{session_id}/messages", response_model=list[ChatMessageOut])
async def get_messages(session_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Message).where(Message.session_id == session_id).order_by(Message.id)
    )
    return list(res.scalars().all())


@router.post("/{session_id}/messages", response_model=MessageOut)
async def send_message(
    session_id: int, 
    payload: MessageIn, 
    request: Request, 
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    session = await _load_session(db, session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    if session.status != "active":
        raise HTTPException(400, f"Session is {session.status}, dialog is over")

    char = session.character

    # Сохраняем сообщение пользователя
    db.add(Message(session_id=session.id, role="user", content=payload.content))
    await db.commit()

    # Загружаем всю историю
    res = await db.execute(
        select(Message).where(Message.session_id == session_id).order_by(Message.id)
    )
    history = list(res.scalars().all())

    # Формируем промпт
    messages = [{"role": "system", "content": chat_system_prompt(session, char)}]
    
    # Обязательно упаковываем прошлые ответы ИИ в JSON, чтобы не ломать response_format
    for m in history:
        if m.role == "assistant":
            assistant_json = json.dumps({
                "reply": m.content,
                "score": m.score_delta,
                "status": "active",
                "reason": ""
            }, ensure_ascii=False)
            messages.append({"role": "assistant", "content": assistant_json})
        else:
            messages.append({"role": "user", "content": m.content})

    # Извлекаем ключ пользователя из заголовка
    user_key = request.headers.get("X-DeepSeek-Key")

    try:
        data = await call_deepseek(
            messages, 
            temperature=0.95, 
            max_tokens=600,
            api_key=user_key  # Передаем ключ
        )
    except DeepSeekError as e:
        raise HTTPException(502, str(e))

    reply = str(data.get("reply", "")).strip() or "..."
    try:
        score = int(data.get("score", 0))
    except (TypeError, ValueError):
        score = 0
    score = max(-10, min(10, score))

    ai_status = str(data.get("status", "active")).lower()
    if ai_status not in ("active", "won", "ghosted"):
        ai_status = "active"
    reason = data.get("reason")

    # Применяем очки и интерес
    session.total_score += score
    session.engagement = max(0, min(MAX_ENGAGEMENT, session.engagement + int(score / 3)))
    session.turn_count += 1

    # Логика завершения игры
    status = ai_status
    if status == "won" and (session.total_score < char.date_threshold or session.engagement < 10):
        status = "active"
    if session.engagement <= 0:
        status = "ghosted"
    if status == "active" and session.turn_count >= MAX_TURNS:
        status = "ghosted"

    session.status = status
    if status == "ghosted" and reply in ("", "..."):
        reply = "прости, мне пора…"

    db.add(Message(session_id=session.id, role="assistant", content=reply, score_delta=score))
    await db.commit()

    new_ach = await check_and_award_achievements(db, current_user, session, score, status)
    
    return MessageOut(
        reply=reply, 
        score=score, 
        status=status, 
        reason=reason,
        total_score=session.total_score, 
        engagement=session.engagement,
        turn_count=session.turn_count, 
        date_threshold=char.date_threshold,
        new_achievements=new_ach,
    )