from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from ..booking_engine import get_amenity_or_404
from ..database import get_session
from ..models import AmenityGuideline
from ..schemas import AmenityOut, AmenityPolicyOut, GuidelineOut
from ..models import Amenity

router = APIRouter()


def _amenity_out(a: Amenity) -> AmenityOut:
    return AmenityOut(
        id=a.id,
        name=a.name,
        description=a.description,
        type=a.type,
        building=a.building,
        floor=a.floor,
        capacity=a.capacity,
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
    )


@router.get("/amenities", response_model=list[AmenityOut])
def list_amenities(session: Session = Depends(get_session)):
    amenities = session.exec(select(Amenity)).all()
    return [_amenity_out(a) for a in amenities]


@router.get("/amenities/{amenity_id}", response_model=AmenityOut)
def get_amenity(amenity_id: str, session: Session = Depends(get_session)):
    amenity = get_amenity_or_404(session, amenity_id)
    return _amenity_out(amenity)


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
