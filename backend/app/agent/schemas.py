from typing import Optional

from pydantic import BaseModel


class AgentChatRequest(BaseModel):
    session_id: Optional[str] = None
    user_id: str
    message: str


class AgentBookingRef(BaseModel):
    id: str
    access_token: Optional[str] = None


class AgentOption(BaseModel):
    label: str
    value: str
    detail: Optional[str] = None


class AgentOptionsBlock(BaseModel):
    kind: str
    options: list[AgentOption]


class AgentChatResponse(BaseModel):
    session_id: str
    message: str
    booking: Optional[AgentBookingRef] = None
    options: Optional[AgentOptionsBlock] = None
