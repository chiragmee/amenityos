from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from ..booking_engine import get_current_balance, get_user_or_404
from ..database import get_session
from ..models import Booking, CreditLedger
from ..schemas import BookingOut, CreditsOut, LedgerEntryOut, UserOut

router = APIRouter()


def _user_out(session: Session, user) -> UserOut:
    return UserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        company=user.company,
        building=user.building,
        floor=user.floor,
        role=user.role,
        is_active=user.is_active,
        credits=get_current_balance(session, user.id),
    )


@router.get("/users/{user_id}", response_model=UserOut)
def get_user(user_id: str, session: Session = Depends(get_session)):
    user = get_user_or_404(session, user_id)
    return _user_out(session, user)


@router.get("/users/{user_id}/bookings", response_model=list[BookingOut])
def get_user_bookings(user_id: str, session: Session = Depends(get_session)):
    get_user_or_404(session, user_id)
    bookings = session.exec(
        select(Booking).where(Booking.user_id == user_id).order_by(Booking.start_time)
    ).all()

    out = []
    for b in bookings:
        ledger_row = session.exec(
            select(CreditLedger).where(CreditLedger.booking_id == b.id)
        ).first()
        credits_deducted = -ledger_row.amount if ledger_row else 0
        out.append(
            BookingOut(
                id=b.id,
                user_id=b.user_id,
                amenity_id=b.amenity_id,
                start_time=b.start_time,
                end_time=b.end_time,
                status=b.status,
                attendee_count=b.attendee_count,
                credits_deducted=credits_deducted,
                access_token=b.access_token_id,
                created_at=b.created_at,
            )
        )
    return out


@router.get("/users/{user_id}/credits", response_model=CreditsOut)
def get_user_credits(user_id: str, session: Session = Depends(get_session)):
    get_user_or_404(session, user_id)
    entries = session.exec(
        select(CreditLedger)
        .where(CreditLedger.user_id == user_id)
        .order_by(CreditLedger.created_at)
    ).all()
    balance = sum(e.amount for e in entries)
    return CreditsOut(
        user_id=user_id,
        balance=balance,
        ledger=[
            LedgerEntryOut(
                id=e.id,
                transaction_type=e.transaction_type,
                amount=e.amount,
                balance_after=e.balance_after,
                booking_id=e.booking_id,
                created_at=e.created_at,
            )
            for e in entries
        ],
    )
