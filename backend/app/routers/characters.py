from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..models import Character
from ..schemas import CharacterGenerateIn, CharacterManualIn, CharacterOut
from ..deepseek import call_deepseek, DeepSeekError
from ..prompts import character_generation_messages

router = APIRouter(prefix="/api/characters", tags=["characters"])

@router.post("/generate", response_model=CharacterOut)
async def generate_character(
    payload: CharacterGenerateIn, 
    request: Request, 
    db: AsyncSession = Depends(get_db)
):
    # Извлекаем ключ пользователя из заголовка (если он есть)
    user_key = request.headers.get("X-DeepSeek-Key")
    
    try:
        data = await call_deepseek(
            character_generation_messages(payload.difficulty),
            temperature=1.1, 
            max_tokens=500,
            api_key=user_key  # Передаем ключ в DeepSeek
        )
    except DeepSeekError as e:
        raise HTTPException(502, str(e))

    try:
        char = Character(
            name=str(data["name"])[:100],
            age=int(data["age"]),
            archetype=str(data["archetype"])[:100],
            personality=str(data["personality"]),
            interests=list(data.get("interests") or []),
            unique_summary=str(data.get("unique_summary") or ""),
            difficulty=payload.difficulty,
            date_threshold=int(data["date_threshold"]),
            initial_patience=int(data["initial_patience"]),
        )
    except (KeyError, ValueError, TypeError) as e:
        raise HTTPException(502, f"Bad character from AI: {e}")

    db.add(char)
    await db.commit()
    await db.refresh(char)
    return char


@router.post("", response_model=CharacterOut)
async def create_character(payload: CharacterManualIn, db: AsyncSession = Depends(get_db)):
    thresholds = {"easy": 50, "medium": 65, "hard": 85}
    patience = {"easy": 16, "medium": 12, "hard": 8}
    
    char = Character(
        name=payload.name,
        age=payload.age,
        archetype=payload.archetype,
        personality=payload.personality,
        interests=payload.interests,
        unique_summary=payload.unique_summary or payload.personality[:120],
        difficulty=payload.difficulty,
        date_threshold=thresholds[payload.difficulty],
        initial_patience=patience[payload.difficulty],
    )
    db.add(char)
    await db.commit()
    await db.refresh(char)
    return char


@router.get("/{character_id}", response_model=CharacterOut)
async def get_character(character_id: int, db: AsyncSession = Depends(get_db)):
    char = await db.get(Character, character_id)
    if not char:
        raise HTTPException(404, "Character not found")
    return char