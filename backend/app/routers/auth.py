from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models import User, UserAchievement
from ..schemas import UserCreate, Token, AchievementOut
from ..auth import get_password_hash, verify_password, create_access_token, get_current_user
from typing import List

router = APIRouter(prefix="/api/auth", tags=["auth"])  # <-- ВАЖНО: есть ли эта строка?

@router.post("/register", response_model=Token)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == user_data.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Пользователь с таким логином уже существует")
        
    user = User(username=user_data.username, password_hash=get_password_hash(user_data.password))
    db.add(user)
    await db.commit()
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == form_data.username))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me/achievements", response_model=List[AchievementOut])
async def get_my_achievements(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(UserAchievement).where(UserAchievement.user_id == user.id))
    return list(res.scalars().all())