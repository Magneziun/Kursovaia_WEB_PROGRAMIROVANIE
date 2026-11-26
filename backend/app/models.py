from datetime import datetime
from sqlalchemy import String, Integer, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


class Character(Base):
    __tablename__ = "characters"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    age: Mapped[int] = mapped_column(Integer)
    archetype: Mapped[str] = mapped_column(String(100))
    personality: Mapped[str] = mapped_column(Text)
    interests: Mapped[list] = mapped_column(JSON, default=list)
    unique_summary: Mapped[str] = mapped_column(Text)
    difficulty: Mapped[str] = mapped_column(String(20), default="medium")
    date_threshold: Mapped[int] = mapped_column(Integer, default=65)
    initial_patience: Mapped[int] = mapped_column(Integer, default=12)


class Session(Base):
    __tablename__ = "sessions"
    id: Mapped[int] = mapped_column(primary_key=True)
    character_id: Mapped[int] = mapped_column(ForeignKey("characters.id"))
    player_name: Mapped[str] = mapped_column(String(100))
    player_age: Mapped[int] = mapped_column(Integer)
    player_height: Mapped[int] = mapped_column(Integer)
    player_weight: Mapped[int] = mapped_column(Integer)
    player_attractiveness: Mapped[int] = mapped_column(Integer)
    player_intelligence: Mapped[int] = mapped_column(Integer)
    total_score: Mapped[int] = mapped_column(Integer, default=0)
    engagement: Mapped[int] = mapped_column(Integer, default=12)
    turn_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    character: Mapped["Character"] = relationship(lazy="joined")
    messages: Mapped[list["Message"]] = relationship(back_populates="session")


class Message(Base):
    __tablename__ = "messages"
    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("sessions.id"))
    role: Mapped[str] = mapped_column(String(20))
    content: Mapped[str] = mapped_column(Text)
    score_delta: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    session: Mapped["Session"] = relationship(back_populates="messages")