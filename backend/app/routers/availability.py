from datetime import timedelta

from fastapi import APIRouter, Depends
from sqlmodel import Session

from ..booking_engine import find_conflicts, get_amenity_or_404
from ..database import get_session
from ..schemas import AvailabilityCheckRequest, AvailabilityCheckResponse, ConflictWindow

router = APIRouter()


@router.post("/availability/check", response_model=AvailabilityCheckResponse)
def check_availability(
    payload: AvailabilityCheckRequest, session: Session = Depends(get_session)
):
    get_amenity_or_404(session, payload.amenity_id)
    end_time = payload.start_time + timedelta(minutes=payload.duration_minutes)
    conflicts = find_conflicts(session, payload.amenity_id, payload.start_time, end_time)
    return AvailabilityCheckResponse(
        available=len(conflicts) == 0,
        conflicts=[ConflictWindow(start_time=c.start_time, end_time=c.end_time) for c in conflicts],
    )
