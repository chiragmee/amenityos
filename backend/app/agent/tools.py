"""
The agent's hands — per docs/05-tool-contracts.md and AGENTS.md's "never
give the model raw database access" rule.

Every function here is a thin, validated wrapper around code that already
exists in booking_engine.py. None of them add new business logic; they
translate between the tool-contract shapes the LLM expects and the
deterministic engine that was already built and tested. `create_booking`
in particular is a direct call into the same atomic, idempotent, fully
validated function the manual booking form uses — the agent cannot bypass
any check a human user booking manually would hit.

Every tool returns a plain JSON-serializable dict, including on failure
(never raises to the caller) — the orchestrator always gets a result to
feed back to the model, per docs/03's TOOL FAILURE handling.
"""

from datetime import datetime, timedelta
from typing import Optional

from sqlmodel import Session, select

from .. import booking_engine as engine
from ..errors import AppError
from ..models import Amenity, AmenityGuideline, Booking, User


def _dt(value: str) -> datetime:
    """Parse an LLM-provided timestamp. Naive wall-clock, no UTC shift —
    same convention as lib/backend-time.ts on the frontend."""
    from ..models import to_naive_utc

    return to_naive_utc(datetime.fromisoformat(value))


def get_user_profile(session: Session, user_id: str) -> dict:
    try:
        user = engine.get_user_or_404(session, user_id)
    except AppError as err:
        return {"error_code": err.code.value, "message": err.message}
    return {
        "user_id": user.id,
        "name": user.name,
        "company": user.company,
        "building": user.building,
        "floor": user.floor,
        "role": user.role.value,
        "is_active": user.is_active,
    }


def search_amenities(
    session: Session,
    query: Optional[str] = None,
    building: Optional[str] = None,
    attendee_count: Optional[int] = None,
) -> dict:
    amenities = session.exec(select(Amenity).where(Amenity.is_active == True)).all()  # noqa: E712
    q = (query or "").lower().strip()
    results = []
    for a in amenities:
        if q and q not in a.name.lower() and q not in a.type.lower():
            continue
        if building and building.lower() != a.building.lower():
            continue
        if attendee_count and attendee_count > a.capacity:
            continue
        results.append(
            {
                "amenity_id": a.id,
                "name": a.name,
                "building": a.building,
                "floor": a.floor,
                "capacity": a.capacity,
                "is_paid": a.is_paid,
            }
        )
    return {"results": results}


def get_amenity_policy(session: Session, amenity_id: str, question: Optional[str] = None) -> dict:
    try:
        engine.get_amenity_or_404(session, amenity_id)
    except AppError as err:
        return {"error_code": err.code.value, "message": err.message}
    guidelines = session.exec(
        select(AmenityGuideline).where(AmenityGuideline.amenity_id == amenity_id)
    ).all()
    # No semantic retrieval yet (Phase B / docs/07-rag.md) — full guideline
    # text is returned as-is rather than a top-k relevant chunk.
    return {
        "amenity_id": amenity_id,
        "sources": [{"document": g.document_name} for g in guidelines],
        "policy_context": "\n\n".join(g.content for g in guidelines) or "No guidelines on file.",
    }


def check_eligibility(session: Session, user_id: str, amenity_id: str) -> dict:
    try:
        user = engine.get_user_or_404(session, user_id)
        amenity = engine.get_amenity_or_404(session, amenity_id)
    except AppError as err:
        return {"error_code": err.code.value, "message": err.message}
    eligible, reason = engine.check_eligibility(session, user, amenity)
    return {"eligible": eligible, "reason": reason or None}


def check_availability(
    session: Session,
    amenity_id: str,
    start_time: str,
    duration_minutes: int,
    attendee_count: int,
) -> dict:
    try:
        amenity = engine.get_amenity_or_404(session, amenity_id)
    except AppError as err:
        return {"error_code": err.code.value, "message": err.message}

    start = _dt(start_time)
    end = start + timedelta(minutes=duration_minutes)
    conflicts = engine.find_conflicts(session, amenity_id, start, end)
    if not conflicts:
        return {"available": True, "alternatives": []}

    alternatives = []
    # Same amenity, next few slots later the same day (nearest-time first,
    # per docs/03's AVAILABILITY rule).
    probe = end
    for _ in range(4):
        probe_end = probe + timedelta(minutes=duration_minutes)
        if probe.date() != start.date():
            break
        if not engine.find_conflicts(session, amenity_id, probe, probe_end):
            alternatives.append(
                {"amenity_id": amenity_id, "start_time": probe.isoformat(), "duration_minutes": duration_minutes}
            )
            if len(alternatives) >= 2:
                break
        probe = probe_end

    # Other active amenities with enough capacity, same requested time.
    if len(alternatives) < 3:
        others = session.exec(
            select(Amenity).where(Amenity.is_active == True, Amenity.id != amenity_id)  # noqa: E712
        ).all()
        for other in others:
            if other.capacity < attendee_count:
                continue
            if not engine.find_conflicts(session, other.id, start, end):
                alternatives.append(
                    {"amenity_id": other.id, "start_time": start.isoformat(), "duration_minutes": duration_minutes}
                )
            if len(alternatives) >= 3:
                break

    return {"available": False, "alternatives": alternatives}


def calculate_booking_cost(
    session: Session, user_id: str, amenity_id: str, start_time: str, duration_minutes: int
) -> dict:
    try:
        engine.get_user_or_404(session, user_id)
        amenity = engine.get_amenity_or_404(session, amenity_id)
    except AppError as err:
        return {"error_code": err.code.value, "message": err.message}
    balance = engine.get_current_balance(session, user_id)
    return {
        "is_paid": amenity.is_paid,
        "credits_required": amenity.credit_cost,
        "current_balance": balance,
        "sufficient_credits": balance >= amenity.credit_cost,
    }


def create_booking(
    session: Session,
    user_id: str,
    amenity_id: str,
    start_time: str,
    duration_minutes: int,
    attendee_count: int,
    idempotency_key: str,
    attendee_ids: Optional[list[str]] = None,
) -> dict:
    try:
        booking, credits_deducted = engine.create_booking(
            session,
            user_id=user_id,
            amenity_id=amenity_id,
            start_time=_dt(start_time),
            duration_minutes=duration_minutes,
            attendee_count=attendee_count,
            attendee_ids=attendee_ids or [],
            idempotency_key=idempotency_key,
        )
    except AppError as err:
        return {"success": False, "error_code": err.code.value, "message": err.message}
    return {
        "success": True,
        "booking_id": booking.id,
        "start_time": booking.start_time.isoformat(),
        "end_time": booking.end_time.isoformat(),
        "credits_deducted": credits_deducted,
    }


def get_booking(session: Session, booking_id: str) -> dict:
    booking = session.get(Booking, booking_id)
    if booking is None:
        return {"error_code": "BOOKING_NOT_FOUND", "message": f"No booking with id '{booking_id}'."}
    return {
        "booking_id": booking.id,
        "amenity_id": booking.amenity_id,
        "start_time": booking.start_time.isoformat(),
        "end_time": booking.end_time.isoformat(),
        "status": booking.status.value,
        "attendee_count": booking.attendee_count,
    }


def generate_access_token(session: Session, booking_id: str) -> dict:
    # create_booking already issues a token — this returns the existing
    # one rather than minting a second, per docs/19's tool-mapping note.
    booking = session.get(Booking, booking_id)
    if booking is None:
        return {"error_code": "BOOKING_NOT_FOUND", "message": f"No booking with id '{booking_id}'."}
    return {
        "token": booking.access_token_id,
        "valid_from": booking.start_time.isoformat(),
        "valid_until": booking.end_time.isoformat(),
    }


# Registry the orchestrator uses to dispatch a tool call by name. Keep in
# sync with the FunctionDeclaration list in orchestrator.py.
REGISTRY = {
    "get_user_profile": get_user_profile,
    "search_amenities": search_amenities,
    "get_amenity_policy": get_amenity_policy,
    "check_eligibility": check_eligibility,
    "check_availability": check_availability,
    "calculate_booking_cost": calculate_booking_cost,
    "create_booking": create_booking,
    "get_booking": get_booking,
    "generate_access_token": generate_access_token,
}
