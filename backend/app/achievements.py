from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .models import User, UserAchievement, Session

ACHIEVEMENTS = {
    "first_message": "Первые шаги",
    "first_negative": "Ничего страшного",
    "first_ghost": "Поклевка сорвалась",
    "score_over_5": "Это было очень COLD 🥶",
    "first_win": "Первый улов"
}

async def check_and_award_achievements(db: AsyncSession, user: User, session: Session, score: int, status: str):
    """Проверяет условия и выдает ачивки. Возвращает список новых кодов."""
    if not user:
        return []
        
    # Получаем уже имеющиеся ачивки
    res = await db.execute(select(UserAchievement.code).where(UserAchievement.user_id == user.id))
    existing = set(res.scalars().all())
    
    new_achievements = []
    
    def unlock(code):
        if code not in existing:
            db.add(UserAchievement(user_id=user.id, code=code))
            new_achievements.append(code)
            existing.add(code)

    # 1. Первые шаги (отправлено сообщение)
    unlock("first_message")
    
    # 2. Ничего страшного (отрицательный балл)
    if score < 0:
        unlock("first_negative")
        
    # 4. Это было очень COLD (балл > 5)
    if score > 5:
        unlock("score_over_5")
        
    # 3 и 5. Завершение игры
    if status == "ghosted":
        unlock("first_ghost")
    elif status == "won":
        unlock("first_win")
        
    if new_achievements:
        await db.commit()
        
    return new_achievements