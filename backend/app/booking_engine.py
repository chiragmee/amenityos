"""
Deterministic booking engine.

Every check here is plain code against the database — no LLM involvement.
Per AGENTS.md / docs/09-booking-lifecycle.md: the LLM never mutates state
directly, and this module is the only path that creates or validates a
booking. Validation order matches the contract given for the backend build:

user active -> amenity active -> eligibility -> capacity -> working hours
-> allowed duration -> advance booking window -> booking limits
-> conflicts -> credits.
"""

import uuid
from dataclasses import dataclass
from datetime import datetime, time, timedelta
from typing import Optional

from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from .access_token import generate_token
from .errors import AppError, ErrorCode
from .models import (
    Amenity,
    AmenityRule,
    AuditLog,
    AuditResult,
    Booking,
    BookingAttendee,
    BookingStatus,
    CreditLedger,
    RuleType,
    TransactionType,
    User,
    to_naive_utc,
    utcnow,
)


@dataclass
class ValidationResult:
    valid: bool
    error_code: Optional[ErrorCode]
    message: Optional[str]
    is_paid: bool
    credit_cost: int
    current_balance: int
    sufficient_credits: bool
    conflicts: list[Booking]


def get_user_or_404(session: Session, user_id: str) -> User:
    user = session.get(User, user_id)
    if user is None:
        raise AppError(ErrorCode.USER_NOT_FOUND, f"No user with id '{user_id}'.")
    return user


def get_amenity_or_404(session: Session, amenity_id: str) -> Amenity:
    amenity = session.get(Amenity, amenity_id)
    if amenity is None:
        raise AppError(ErrorCode.AMENITY_NOT_FOUND, f"No amenity with id '{amenity_id}'.")
    return amenity


def get_current_balance(session: Session, user_id: str) -> int:
    entries = session.exec(
        select(CreditLedger).where(CreditLedger.user_id == user_id)
    ).all()
    return sum(e.amount for e in entries)


def _active_bookings_for_amenity(
    session: Session, amenity_id: str, exclude_booking_id: Optional[str] = None
) -> list[Booking]:
    stmt = select(Booking).where(
        Booking.amenity_id == amenity_id,
        Booking.status == BookingStatus.confirmed,
    )
    bookings = session.exec(stmt).all()
    if exclude_booking_id:
        bookings = [b for b in bookings if b.id != exclude_booking_id]
    return bookings


def find_conflicts(
    session: Session,
    amenity_id: str,
    start_time: datetime,
    end_time: datetime,
    exclude_booking_id: Optional[str] = None,
) -> list[Booking]:
    start_time = to_naive_utc(start_time)
    end_time = to_naive_utc(end_time)
    conflicts = []
    for b in _active_bookings_for_amenity(session, amenity_id, exclude_booking_id):
        if b.start_time < end_time and b.end_time > start_time:
            conflicts.append(b)
    return conflicts


def check_eligibility(session: Session, user: User, amenity: Amenity) -> tuple[bool, str]:
    rules = session.exec(
        select(AmenityRule).where(AmenityRule.amenity_id == amenity.id)
    ).all()

    role_rules = [r.rule_value for r in rules if r.rule_type == RuleType.eligible_role]
    company_rules = [r.rule_value for r in rules if r.rule_type == RuleType.eligible_company]

    if role_rules and user.role.value not in role_rules:
        return False, f"This amenity is restricted to: {', '.join(role_rules)}."
    if company_rules and user.company not in company_rules:
        return False, "This amenity is not available for your organization."
    return True, ""


def check_allowed_weekday(session: Session, amenity: Amenity, start_time: datetime) -> tuple[bool, str]:
    rules = session.exec(
        select(AmenityRule).where(
            AmenityRule.amenity_id == amenity.id,
            AmenityRule.rule_type == RuleType.allowed_weekday,
        )
    ).all()
    if not rules:
        return True, ""
    allowed = {r.rule_value.lower()[:3] for r in rules}
    weekday_name = start_time.strftime("%a").lower()[:3]
    if weekday_name not in allowed:
        return False, "This amenity is not available on the requested day."
    return True, ""


def _parse_hhmm(value: str) -> time:
    hour, minute = value.split(":")
    return time(int(hour), int(minute))


def validate_booking(
    session: Session,
    user: User,
    amenity: Amenity,
    start_time: datetime,
    duration_minutes: int,
    attendee_count: int,
    exclude_booking_id: Optional[str] = None,
) -> ValidationResult:
    start_time = to_naive_utc(start_time)
    end_time = start_time + timedelta(minutes=duration_minutes)
    now = utcnow()

    current_balance = get_current_balance(session, user.id)

    def invalid(code: ErrorCode, message: str) -> ValidationResult:
        return ValidationResult(
            valid=False,
            error_code=code,
            message=message,
            is_paid=amenity.is_paid,
            credit_cost=amenity.credit_cost,
            current_balance=current_balance,
            sufficient_credits=current_balance >= amenity.credit_cost,
            conflicts=[],
        )

    # 1. user active
    if not user.is_active:
        return invalid(ErrorCode.USER_INACTIVE, "This user account is inactive.")

    # 2. amenity active
    if not amenity.is_active:
        return invalid(ErrorCode.AMENITY_INACTIVE, "This amenity is not currently active.")

    # 3. eligibility
    eligible, reason = check_eligibility(session, user, amenity)
    if not eligible:
        return invalid(ErrorCode.NOT_ELIGIBLE, reason)

    weekday_ok, weekday_reason = check_allowed_weekday(session, amenity, start_time)
    if not weekday_ok:
        return invalid(ErrorCode.NOT_ELIGIBLE, weekday_reason)

    # 4. capacity
    if attendee_count > amenity.capacity:
        return invalid(
            ErrorCode.CAPACITY_EXCEEDED,
            f"{amenity.name} has a capacity of {amenity.capacity}, requested {attendee_count}.",
        )

    # 5. working hours (booking must sit entirely within the amenity's hours,
    # on the same calendar day — no overnight bookings in the MVP)
    window_start = _parse_hhmm(amenity.working_hours_start)
    window_end = _parse_hhmm(amenity.working_hours_end)
    if (
        start_time.date() != end_time.date()
        or start_time.time() < window_start
        or end_time.time() > window_end
    ):
        return invalid(
            ErrorCode.OUTSIDE_WORKING_HOURS,
            f"{amenity.name} is available {amenity.working_hours_start}-{amenity.working_hours_end}.",
        )

    # 6. allowed duration
    duration_ok = amenity.minimum_duration_minutes <= duration_minutes <= amenity.maximum_duration_minutes
    if amenity.allowed_durations:
        duration_ok = duration_ok and duration_minutes in amenity.allowed_durations
    if not duration_ok:
        return invalid(
            ErrorCode.INVALID_DURATION,
            f"Duration must be between {amenity.minimum_duration_minutes} and "
            f"{amenity.maximum_duration_minutes} minutes.",
        )

    # 7. advance booking window (also rejects bookings not in the future)
    if start_time <= now:
        return invalid(ErrorCode.ADVANCE_BOOKING_WINDOW_EXCEEDED, "Booking start time must be in the future.")
    if start_time - now > timedelta(hours=amenity.advance_booking_hours):
        return invalid(
            ErrorCode.ADVANCE_BOOKING_WINDOW_EXCEEDED,
            f"{amenity.name} can only be booked up to {amenity.advance_booking_hours} hours in advance.",
        )

    # 8. booking limits (active/future confirmed bookings this user holds for this amenity)
    existing = [
        b
        for b in _active_bookings_for_amenity(session, amenity.id, exclude_booking_id)
        if b.user_id == user.id and b.end_time > now
    ]
    if len(existing) >= amenity.max_bookings_per_user:
        return invalid(
            ErrorCode.BOOKING_LIMIT_EXCEEDED,
            f"You already have {len(existing)} active booking(s) for {amenity.name} "
            f"(limit {amenity.max_bookings_per_user}).",
        )

    # 9. conflicts
    conflicts = find_conflicts(session, amenity.id, start_time, end_time, exclude_booking_id)
    if conflicts:
        result = invalid(ErrorCode.SLOT_UNAVAILABLE, "The requested time is no longer available.")
        result.conflicts = conflicts
        return result

    # 10. credits
    if amenity.is_paid and current_balance < amenity.credit_cost:
        return invalid(
            ErrorCode.INSUFFICIENT_CREDITS,
            f"{amenity.name} costs {amenity.credit_cost} credits; you have {current_balance}.",
        )

    return ValidationResult(
        valid=True,
        error_code=None,
        message=None,
        is_paid=amenity.is_paid,
        credit_cost=amenity.credit_cost,
        current_balance=current_balance,
        sufficient_credits=True,
        conflicts=[],
    )


def _log_audit(
    session: Session,
    user_id: Optional[str],
    action: str,
    entity_type: str,
    entity_id: Optional[str],
    result: AuditResult,
    metadata: Optional[str] = None,
) -> None:
    session.add(
        AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            result=result,
            log_metadata=metadata,
        )
    )


def create_booking(
    session: Session,
    user_id: str,
    amenity_id: str,
    start_time: datetime,
    duration_minutes: int,
    attendee_count: int,
    attendee_ids: list[str],
    idempotency_key: str,
) -> tuple[Booking, int]:
    """Validate and create a booking. Returns (booking, credits_deducted).

    Raises AppError on any validation failure. Paid bookings deduct credits
    and create the booking row in the same transaction.
    """
    existing = session.exec(
        select(Booking).where(Booking.idempotency_key == idempotency_key)
    ).first()
    if existing is not None:
        deducted = 0
        if existing.status == BookingStatus.confirmed:
            ledger_row = session.exec(
                select(CreditLedger).where(CreditLedger.booking_id == existing.id)
            ).first()
            deducted = -ledger_row.amount if ledger_row else 0
        return existing, deducted

    user = get_user_or_404(session, user_id)
    amenity = get_amenity_or_404(session, amenity_id)

    result = validate_booking(session, user, amenity, start_time, duration_minutes, attendee_count)
    if not result.valid:
        _log_audit(session, user_id, "create_booking", "booking", None, AuditResult.failure, result.error_code.value)
        session.commit()
        raise AppError(result.error_code, result.message)

    start_time = to_naive_utc(start_time)
    end_time = start_time + timedelta(minutes=duration_minutes)

    booking = Booking(
        id=f"bk_{uuid.uuid4().hex[:12]}",
        user_id=user_id,
        amenity_id=amenity_id,
        start_time=start_time,
        end_time=end_time,
        status=BookingStatus.confirmed,
        attendee_count=attendee_count,
        idempotency_key=idempotency_key,
        confirmed_at=utcnow(),
    )
    booking.access_token_id = generate_token(booking.id)

    try:
        session.add(booking)
        for attendee_id in attendee_ids:
            session.add(BookingAttendee(booking_id=booking.id, user_id=attendee_id))

        credits_deducted = 0
        if amenity.is_paid:
            credits_deducted = amenity.credit_cost
            new_balance = result.current_balance - credits_deducted
            session.add(
                CreditLedger(
                    user_id=user_id,
                    booking_id=booking.id,
                    transaction_type=TransactionType.debit,
                    amount=-credits_deducted,
                    balance_after=new_balance,
                )
            )

        _log_audit(session, user_id, "create_booking", "booking", booking.id, AuditResult.success)
        session.commit()
    except IntegrityError:
        # Concurrent request created a booking with the same idempotency_key
        # between our check above and this insert. Return that one instead.
        session.rollback()
        existing = session.exec(
            select(Booking).where(Booking.idempotency_key == idempotency_key)
        ).first()
        if existing is not None:
            return existing, 0
        raise

    session.refresh(booking)
    return booking, credits_deducted
