from datetime import datetime

from pydantic import BaseModel


class AssistantQueryIn(BaseModel):
    question: str


class AssistantQueryOut(BaseModel):
    answer: str
    source: str
    created_at: datetime
