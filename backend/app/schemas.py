from typing import Optional, List, Literal
from pydantic import BaseModel, Field

Difficulty = Literal["easy", "medium", "hard"]

class PlayerProfileIn(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    age: int = Field(ge=18, le=80)
    height: int = Field(ge=140, le=220)
    weight: int = Field(ge=40, le=200)
    attractiveness: int = Field(ge=1, le=10)
    intelligence: int = Field(ge=1, le=10)

class CharacterGenerateIn(BaseModel):
    difficulty: Difficulty = "medium"

class CharacterManualIn(BaseModel):
    name: str
    age: int = Field(ge=18, le=60)
    archetype: str
    personality: str
    interests: List[str] = []
    unique_summary: str = ""
    difficulty: Difficulty = "medium"

class CharacterOut(BaseModel):
    id: int
    name: str
    age: int
    archetype: str
    personality: str
    interests: List[str]
    unique_summary: str
    difficulty: str
    date_threshold: int
    initial_patience: int
    class Config: from_attributes = True

class SessionCreateIn(BaseModel):
    character_id: int
    player: PlayerProfileIn

class SessionOut(BaseModel):
    id: int
    status: str
    total_score: int
    engagement: int
    turn_count: int
    character: CharacterOut
    class Config: from_attributes = True

class MessageIn(BaseModel):
    content: str = Field(min_length=1, max_length=2000)

class MessageOut(BaseModel):
    reply: str
    score: int
    status: str
    reason: Optional[str] = None
    total_score: int
    engagement: int
    turn_count: int
    date_threshold: int

class ChatMessageOut(BaseModel):
    id: int
    role: str
    content: str
    score_delta: int
    class Config: from_attributes = True