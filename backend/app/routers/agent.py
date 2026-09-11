from fastapi import APIRouter, Depends
from sqlmodel import Session

from ..agent.orchestrator import run_turn
from ..agent.schemas import AgentChatRequest, AgentChatResponse
from ..database import get_session

router = APIRouter()


@router.post("/agent/chat", response_model=AgentChatResponse)
def agent_chat(payload: AgentChatRequest, session: Session = Depends(get_session)):
    return run_turn(session, payload)
