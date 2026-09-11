from fastapi import APIRouter, Depends
from sqlmodel import Session

from ..access_token import verify_token
from ..database import get_session
from ..models import Amenity, Booking, BookingStatus, utcnow
from ..schemas import AccessVerifyRequest, AccessVerifyResponse

router = APIRouter()


@router.post("/access/verify", response_model=AccessVerifyResponse)
def verify_access(payload: AccessVerifyRequest, session: Session = Depends(get_session)):
    booking_id = verify_token(payload.token)
    if booking_id is None:
        return AccessVerifyResponse(allowed=False, reason="TOKEN_INVALID")

    booking = session.get(Booking, booking_id)
    if booking is None:
        return AccessVerifyResponse(allowed=False, reason="TOKEN_INVALID")

    if booking.status == BookingStatus.cancelled:
        return AccessVerifyResponse(allowed=False, reason="BOOKING_CANCELLED")

    now = utcnow()
    if now > booking.end_time:
        return AccessVerifyResponse(allowed=False, reason="TOKEN_EXPIRED")

    amenity = session.get(Amenity, booking.amenity_id)
    return AccessVerifyResponse(
        allowed=True,
        booking_id=booking.id,
        amenity=amenity.name if amenity else booking.amenity_id,
        valid_until=booking.end_time,
    )
