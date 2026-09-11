"""
The agent loop — docs/04-agent-architecture.md's "Agent loop" section,
implemented with manual (not automatic) function calling so every tool
call is logged and validated explicitly, per AGENTS.md.

Conversation state is persisted in AgentSession/AgentMessage (this
project's own tables) rather than relying on Gemini's server-side
previous_interaction_id — keeps an independent audit trail and doesn't
couple this app's history to Google's retention policy.
"""

import logging
import os
import time
import uuid
from typing import Callable

from google import genai
from google.genai import errors as genai_errors
from google.genai import types
from sqlmodel import Session, select

from . import tools as agent_tools
from .schemas import AgentBookingRef, AgentChatRequest, AgentChatResponse
from .system_prompt import build_system_instruction
from ..models import AgentMessage, AgentMessageRole, AgentSession, utcnow

logger = logging.getLogger(__name__)

# gemini-flash-latest (currently gemini-3.8-flash) was unreliable under
# load during testing (503 UNAVAILABLE) and its thinking mode adds real
# latency that isn't universally configurable off. flash-lite responded
# in ~3s with no config needed and is more than sufficient for tool
# selection/argument extraction — see docs/13-model-cost-latency.md's
# guidance to prefer the smaller model where quality allows. Revisit once
# quality is actually measured (docs/11), not before.
MODEL_NAME = "gemini-flash-lite-latest"
MAX_TOOL_ROUNDS = 6
MAX_API_RETRIES = 2
RETRY_BACKOFF_SECONDS = 2

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set")
        _client = genai.Client(api_key=api_key)
    return _client


def _make_tool_functions(db: Session) -> list[Callable]:
    """LLM-facing wrappers: same names/behavior as agent_tools.py, minus
    the `session` parameter (bound here via closure so it never appears
    in the schema Gemini sees)."""

    def get_user_profile(user_id: str) -> dict:
        """Retrieve profile information for a user.

        Args:
            user_id: The id of the user to look up.
        """
        return agent_tools.get_user_profile(db, user_id)

    def search_amenities(query: str = "", building: str = "", attendee_count: int = 0) -> dict:
        """Find amenities matching a name or type, optionally filtered by building or attendee count.

        Args:
            query: Free-text amenity name or type, e.g. "gym" or "emerald".
            building: Building name to filter by, if known.
            attendee_count: Minimum capacity required, if known.
        """
        return agent_tools.search_amenities(db, query or None, building or None, attendee_count or None)

    def get_amenity_policy(amenity_id: str, question: str = "") -> dict:
        """Retrieve the guideline/policy text for an amenity.

        Args:
            amenity_id: The amenity's id.
            question: The user's policy question, for context.
        """
        return agent_tools.get_amenity_policy(db, amenity_id, question or None)

    def check_eligibility(user_id: str, amenity_id: str) -> dict:
        """Check whether a user is eligible to book a specific amenity.

        Args:
            user_id: The user's id.
            amenity_id: The amenity's id.
        """
        return agent_tools.check_eligibility(db, user_id, amenity_id)

    def check_availability(
        amenity_id: str, start_time: str, duration_minutes: int, attendee_count: int
    ) -> dict:
        """Check live availability for an amenity at a specific time. Returns real alternatives when unavailable.

        Args:
            amenity_id: The amenity's id.
            start_time: ISO 8601 timestamp with no timezone offset, e.g. "2026-09-15T15:00:00".
            duration_minutes: Requested booking duration in minutes.
            attendee_count: Number of attendees.
        """
        return agent_tools.check_availability(db, amenity_id, start_time, duration_minutes, attendee_count)

    def calculate_booking_cost(
        user_id: str, amenity_id: str, start_time: str, duration_minutes: int
    ) -> dict:
        """Calculate the credit cost of a booking and the user's current balance.

        Args:
            user_id: The user's id.
            amenity_id: The amenity's id.
            start_time: ISO 8601 timestamp with no timezone offset.
            duration_minutes: Requested booking duration in minutes.
        """
        return agent_tools.calculate_booking_cost(db, user_id, amenity_id, start_time, duration_minutes)

    def create_booking(
        user_id: str,
        amenity_id: str,
        start_time: str,
        duration_minutes: int,
        attendee_count: int,
        idempotency_key: str,
    ) -> dict:
        """Create a booking. State-changing — only call after all validation has passed and,
        for paid amenities, the user has explicitly confirmed the cost.

        Args:
            user_id: The user's id.
            amenity_id: The amenity's id.
            start_time: ISO 8601 timestamp with no timezone offset.
            duration_minutes: Requested booking duration in minutes.
            attendee_count: Number of attendees.
            idempotency_key: A unique key for this specific booking request.
        """
        return agent_tools.create_booking(
            db, user_id, amenity_id, start_time, duration_minutes, attendee_count, idempotency_key
        )

    def get_booking(booking_id: str) -> dict:
        """Retrieve details of an existing booking.

        Args:
            booking_id: The booking's id.
        """
        return agent_tools.get_booking(db, booking_id)

    def generate_access_token(booking_id: str) -> dict:
        """Retrieve the access credential for a confirmed booking.

        Args:
            booking_id: The booking's id.
        """
        return agent_tools.generate_access_token(db, booking_id)

    return [
        get_user_profile,
        search_amenities,
        get_amenity_policy,
        check_eligibility,
        check_availability,
        calculate_booking_cost,
        create_booking,
        get_booking,
        generate_access_token,
    ]


def _load_history(db: Session, agent_session_id: str) -> list[types.Content]:
    rows = db.exec(
        select(AgentMessage)
        .where(AgentMessage.session_id == agent_session_id)
        .order_by(AgentMessage.timestamp)
    ).all()
    history = []
    for row in rows:
        role = "user" if row.role == AgentMessageRole.user else "model"
        history.append(types.Content(role=role, parts=[types.Part(text=row.content)]))
    return history


def _resolve_session(db: Session, request: AgentChatRequest) -> AgentSession:
    if request.session_id:
        existing = db.get(AgentSession, request.session_id)
        if existing is not None:
            return existing
        agent_session = AgentSession(id=request.session_id, user_id=request.user_id)
    else:
        agent_session = AgentSession(id=f"sess_{uuid.uuid4().hex[:12]}", user_id=request.user_id)
    db.add(agent_session)
    db.commit()
    db.refresh(agent_session)
    return agent_session


def _send_with_retry(chat, content) -> "types.GenerateContentResponse | None":
    """Gemini's servers occasionally return transient 503s under load.
    Retry briefly; return None (caller falls back to a safe message) if
    it still fails — per docs/17-failure-modes.md's LLM failure handling,
    never let this surface as a raw 500 to the user."""
    last_error = None
    for attempt in range(MAX_API_RETRIES + 1):
        try:
            return chat.send_message(content)
        except genai_errors.ServerError as exc:
            last_error = exc
            logger.warning("Gemini ServerError on attempt %d: %s", attempt + 1, exc)
            if attempt < MAX_API_RETRIES:
                time.sleep(RETRY_BACKOFF_SECONDS * (attempt + 1))
    logger.error("Gemini unavailable after retries: %s", last_error)
    return None


def run_turn(db: Session, request: AgentChatRequest) -> AgentChatResponse:
    agent_session = _resolve_session(db, request)
    history = _load_history(db, agent_session.id)

    db.add(AgentMessage(session_id=agent_session.id, role=AgentMessageRole.user, content=request.message))
    db.commit()

    client = _get_client()
    tool_functions = _make_tool_functions(db)
    declarations = [
        types.FunctionDeclaration.from_callable(client=client, callable=fn) for fn in tool_functions
    ]
    functions_by_name = {fn.__name__: fn for fn in tool_functions}

    chat = client.chats.create(
        model=MODEL_NAME,
        history=history,
        config=types.GenerateContentConfig(
            system_instruction=build_system_instruction(request.user_id, utcnow().isoformat()),
            tools=[types.Tool(function_declarations=declarations)],
            automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
        ),
    )

    response = _send_with_retry(chat, request.message)
    booking_ref: AgentBookingRef | None = None
    degraded = response is None

    if response is not None:
        for _ in range(MAX_TOOL_ROUNDS):
            calls = response.function_calls
            if not calls:
                break
            parts = []
            for call in calls:
                fn = functions_by_name.get(call.name)
                if fn is None:
                    result = {"error_code": "UNKNOWN_TOOL", "message": f"No such tool: {call.name}"}
                else:
                    try:
                        result = fn(**(call.args or {}))
                    except Exception as exc:  # tool failures must reach the model, not crash the turn
                        result = {"error_code": "TOOL_EXCEPTION", "message": str(exc)}

                if call.name == "create_booking" and isinstance(result, dict) and result.get("success"):
                    token_result = functions_by_name["generate_access_token"](booking_id=result["booking_id"])
                    booking_ref = AgentBookingRef(id=result["booking_id"], access_token=token_result.get("token"))

                parts.append(types.Part.from_function_response(name=call.name, response=result))
            response = _send_with_retry(chat, parts)
            if response is None:
                degraded = True
                break

    if degraded:
        # booking_ref may still be set here if a tool call succeeded before
        # the model became unreachable — the frontend can act on it even
        # though we can't get a clean final sentence from the model.
        final_text = (
            "Your booking went through, but I couldn't finish summarizing it — check My Bookings."
            if booking_ref
            else "I'm having trouble reaching the assistant right now. Please try again in a moment."
        )
    else:
        final_text = response.text or "I couldn't complete that — please try again."

    db.add(AgentMessage(session_id=agent_session.id, role=AgentMessageRole.assistant, content=final_text))
    agent_session.updated_at = utcnow()
    db.add(agent_session)
    db.commit()

    return AgentChatResponse(session_id=agent_session.id, message=final_text, booking=booking_ref)
