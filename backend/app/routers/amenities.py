import logging
import re

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from ..booking_engine import get_amenity_or_404
from ..database import get_session
from ..models import AmenityGuideline, AmenityRule, RuleType
from ..rag.ingest import ingest_guidelines
from ..schemas import (
    AmenityCreateRequest,
    AmenityOut,
    AmenityPolicyOut,
    AmenityUpdateRequest,
    GuidelineOut,
)
from ..models import Amenity

logger = logging.getLogger(__name__)

router = APIRouter()


def _amenity_out(session: Session, a: Amenity) -> AmenityOut:
    rules = session.exec(select(AmenityRule).where(AmenityRule.amenity_id == a.id)).all()
    return AmenityOut(
        id=a.id,
        name=a.name,
        description=a.description,
        type=a.type,
        building=a.building,
        floor=a.floor,
        capacity=a.capacity,
        latitude=a.latitude,
        longitude=a.longitude,
        image_url=a.image_url,
        default_duration_minutes=a.default_duration_minutes,
        minimum_duration_minutes=a.minimum_duration_minutes,
        maximum_duration_minutes=a.maximum_duration_minutes,
        allowed_durations=a.allowed_durations,
        working_hours_start=a.working_hours_start,
        working_hours_end=a.working_hours_end,
        is_paid=a.is_paid,
        credit_cost=a.credit_cost,
        max_bookings_per_user=a.max_bookings_per_user,
        advance_booking_hours=a.advance_booking_hours,
        cancellation_window_minutes=a.cancellation_window_minutes,
        is_active=a.is_active,
        eligible_roles=[r.rule_value for r in rules if r.rule_type == RuleType.eligible_role],
        eligible_companies=[r.rule_value for r in rules if r.rule_type == RuleType.eligible_company],
        allowed_weekdays=[r.rule_value for r in rules if r.rule_type == RuleType.allowed_weekday],
    )


def _replace_rules(session: Session, amenity_id: str, rule_type: RuleType, values: list[str]) -> None:
    existing = session.exec(
        select(AmenityRule).where(AmenityRule.amenity_id == amenity_id, AmenityRule.rule_type == rule_type)
    ).all()
    for row in existing:
        session.delete(row)
    for value in values:
        session.add(AmenityRule(amenity_id=amenity_id, rule_type=rule_type, rule_value=value))


def _slugify_id(name: str, session: Session) -> str:
    slug = re.sub(r"[^a-z0-9]+", "", name.lower()) or "new"
    candidate = f"amenity_{slug}"
    suffix = 1
    while session.get(Amenity, candidate) is not None:
        suffix += 1
        candidate = f"amenity_{slug}{suffix}"
    return candidate


def _set_guideline(session: Session, amenity_id: str, content: str) -> None:
    existing = session.exec(
        select(AmenityGuideline).where(AmenityGuideline.amenity_id == amenity_id)
    ).all()
    for g in existing:
        session.delete(g)
    session.add(
        AmenityGuideline(amenity_id=amenity_id, document_name=f"{amenity_id}-guidelines.md", content=content)
    )


def _reingest_rag(session: Session) -> None:
    # A guideline changed — keep the agent's live policy retrieval in sync.
    # Never let this fail the write itself (see docs/17-failure-modes.md).
    try:
        ingest_guidelines(session)
    except Exception:
        logger.exception("RAG: re-ingestion after amenity guideline change failed")


@router.get("/amenities", response_model=list[AmenityOut])
def list_amenities(session: Session = Depends(get_session)):
    amenities = session.exec(select(Amenity)).all()
    return [_amenity_out(session, a) for a in amenities]


@router.get("/amenities/{amenity_id}", response_model=AmenityOut)
def get_amenity(amenity_id: str, session: Session = Depends(get_session)):
    amenity = get_amenity_or_404(session, amenity_id)
    return _amenity_out(session, amenity)


@router.get("/amenities/{amenity_id}/policy", response_model=AmenityPolicyOut)
def get_amenity_policy(amenity_id: str, session: Session = Depends(get_session)):
    get_amenity_or_404(session, amenity_id)
    guidelines = session.exec(
        select(AmenityGuideline).where(AmenityGuideline.amenity_id == amenity_id)
    ).all()
    return AmenityPolicyOut(
        amenity_id=amenity_id,
        guidelines=[
            GuidelineOut(
                document_name=g.document_name,
                document_version=g.document_version,
                content=g.content,
                effective_from=g.effective_from,
                effective_to=g.effective_to,
            )
            for g in guidelines
        ],
    )


@router.post("/amenities", response_model=AmenityOut, status_code=201)
def create_amenity(payload: AmenityCreateRequest, session: Session = Depends(get_session)):
    amenity_id = _slugify_id(payload.name, session)
    amenity = Amenity(
        id=amenity_id,
        name=payload.name,
        description=payload.description,
        type=payload.type,
        building=payload.building,
        floor=payload.floor,
        capacity=payload.capacity,
        latitude=payload.latitude,
        longitude=payload.longitude,
        image_url=payload.image_url,
        default_duration_minutes=payload.default_duration_minutes,
        minimum_duration_minutes=payload.minimum_duration_minutes,
        maximum_duration_minutes=payload.maximum_duration_minutes,
        allowed_durations=payload.allowed_durations,
        working_hours_start=payload.working_hours_start,
        working_hours_end=payload.working_hours_end,
        is_paid=payload.is_paid,
        credit_cost=payload.credit_cost,
        max_bookings_per_user=payload.max_bookings_per_user,
        advance_booking_hours=payload.advance_booking_hours,
        cancellation_window_minutes=payload.cancellation_window_minutes,
    )
    session.add(amenity)
    session.commit()

    _replace_rules(session, amenity_id, RuleType.eligible_role, payload.eligible_roles)
    _replace_rules(session, amenity_id, RuleType.eligible_company, payload.eligible_companies)
    _replace_rules(session, amenity_id, RuleType.allowed_weekday, payload.allowed_weekdays)
    if payload.guideline:
        _set_guideline(session, amenity_id, payload.guideline)
    session.commit()

    if payload.guideline:
        _reingest_rag(session)

    session.refresh(amenity)
    return _amenity_out(session, amenity)


@router.patch("/amenities/{amenity_id}", response_model=AmenityOut)
def update_amenity(amenity_id: str, payload: AmenityUpdateRequest, session: Session = Depends(get_session)):
    amenity = get_amenity_or_404(session, amenity_id)

    updates = payload.model_dump(
        exclude_unset=True,
        exclude={"eligible_roles", "eligible_companies", "allowed_weekdays", "guideline"},
    )
    for key, value in updates.items():
        setattr(amenity, key, value)
    session.add(amenity)
    session.commit()

    if payload.eligible_roles is not None:
        _replace_rules(session, amenity_id, RuleType.eligible_role, payload.eligible_roles)
    if payload.eligible_companies is not None:
        _replace_rules(session, amenity_id, RuleType.eligible_company, payload.eligible_companies)
    if payload.allowed_weekdays is not None:
        _replace_rules(session, amenity_id, RuleType.allowed_weekday, payload.allowed_weekdays)

    guideline_changed = payload.guideline is not None
    if guideline_changed:
        _set_guideline(session, amenity_id, payload.guideline)
    session.commit()

    if guideline_changed:
        _reingest_rag(session)

    session.refresh(amenity)
    return _amenity_out(session, amenity)
