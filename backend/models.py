from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import List, Optional

class User(BaseModel):
    email: str
    hashed_password: str


class Conversation(BaseModel):
    _id: str
    user_id: str
    title: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Message(BaseModel):
    role: str
    content: str
    action: Optional[str] = "chat"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    conversationId: Optional[str] = None
    message: str
    history: List[dict]