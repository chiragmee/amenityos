from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from ..booking_engine import cancel_booking, create_booking, get_amenity_or_404, get_user_or_404, validate_booking
from ..database import get_session
from ..errors import AppError, ErrorCode
from ..models import CreditLedger
from ..schemas import (
    BookingCancelRequest,
    BookingCancelResponse,
    BookingCreateRequest,
    BookingOut,
    BookingValidateRequest,
    BookingValidateResponse,
)
from ..models import Booking

router = APIRouter()


@router.post("/bookings/validate", response_model=BookingValidateResponse)
def validate_booking_route(
    payload: BookingValidateRequest, session: Session = Depends(get_session)
):
    user = get_user_or_404(session, payload.user_id)
    amenity = get_amenity_or_404(session, payload.amenity_id)
    result = validate_booking(
        session, user, amenity, payload.start_time, payload.duration_minutes, payload.attendee_count
    )
    return BookingValidateResponse(
        valid=result.valid,
        error_code=result.error_code.value if result.error_code else None,
        message=result.message,
        is_paid=result.is_paid,
        credit_cost=result.credit_cost,
        current_balance=result.current_balance,
        sufficient_credits=result.sufficient_credits,
    )


@router.post("/bookings", response_model=BookingOut, status_code=201)
def create_booking_route(payload: BookingCreateRequest, session: Session = Depends(get_session)):
    booking, credits_deducted = create_booking(
        session,
        user_id=payload.user_id,
        amenity_id=payload.amenity_id,
        start_time=payload.start_time,
        duration_minutes=payload.duration_minutes,
        attendee_count=payload.attendee_count,
        attendee_ids=payload.attendee_ids,
        idempotency_key=payload.idempotency_key,
    )
    return BookingOut(
        id=booking.id,
        user_id=booking.user_id,
        amenity_id=booking.amenity_id,
        start_time=booking.start_time,
        end_time=booking.end_time,
        status=booking.status,
        attendee_count=booking.attendee_count,
        credits_deducted=credits_deducted,
        access_token=booking.access_token_id,
        created_at=booking.created_at,
    )


@router.post("/bookings/{booking_id}/cancel", response_model=BookingCancelResponse)
def cancel_booking_route(
    booking_id: str, payload: BookingCancelRequest, session: Session = Depends(get_session)
):
    booking, refunded = cancel_booking(session, booking_id, payload.user_id)
    return BookingCancelResponse(
        id=booking.id,
        status=booking.status,
        cancelled_at=booking.cancelled_at,
        refunded_credits=refunded,
    )


@router.get("/bookings/{booking_id}", response_model=BookingOut)
def get_booking(booking_id: str, session: Session = Depends(get_session)):
    booking = session.get(Booking, booking_id)
    if booking is None:
        raise AppError(ErrorCode.BOOKING_NOT_FOUND, f"No booking with id '{booking_id}'.")
    ledger_row = session.exec(
        select(CreditLedger).where(CreditLedger.booking_id == booking.id)
    ).first()
    credits_deducted = -ledger_row.amount if ledger_row else 0
    return BookingOut(
        id=booking.id,
        user_id=booking.user_id,
        amenity_id=booking.amenity_id,
        start_time=booking.start_time,
        end_time=booking.end_time,
        status=booking.status,
        attendee_count=booking.attendee_count,
        credits_deducted=credits_deducted,
        access_token=booking.access_token_id,
        created_at=booking.created_at,
    )
