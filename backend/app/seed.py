"""
Seed demo data: 3 users, 7 amenities (matching the frontend's mock data),
their rules/guidelines, and a couple of realistic pre-existing bookings.

Run with: python -m app.seed
"""

import uuid
from datetime import datetime, timedelta, timezone

from sqlmodel import Session, delete

from .booking_engine import create_booking
from .database import engine, init_db
from .models import (
    Amenity,
    AmenityGuideline,
    AmenityRule,
    AuditLog,
    Booking,
    BookingAttendee,
    CreditLedger,
    RuleType,
    TransactionType,
    User,
    UserRole,
)


def _clear(session: Session) -> None:
    for model in (AuditLog, CreditLedger, BookingAttendee, Booking, AmenityGuideline, AmenityRule, Amenity, User):
        session.exec(delete(model))
    session.commit()


def _grant_credits(session: Session, user_id: str, amount: int) -> None:
    session.add(
        CreditLedger(
            user_id=user_id,
            booking_id=None,
            transaction_type=TransactionType.credit,
            amount=amount,
            balance_after=amount,
        )
    )
    session.commit()


AMENITIES = [
    dict(
        id="amenity_emerald",
        name="Emerald Meeting Room",
        description="6-seat meeting room with display and whiteboard",
        type="Meeting room",
        building="Tower A",
        floor=8,
        capacity=6,
        default_duration_minutes=60,
        minimum_duration_minutes=30,
        maximum_duration_minutes=120,
        allowed_durations=[30, 60, 90, 120],
        working_hours_start="08:00",
        working_hours_end="20:00",
        is_paid=False,
        credit_cost=0,
        max_bookings_per_user=3,
        advance_booking_hours=14 * 24,
        guideline=(
            "Maximum booking duration: 2 hours\nMaximum attendees: 8\n"
            "External guests: Not allowed\nFood: Not allowed\n"
            "Available Monday-Friday\nOperating hours: 8 AM-8 PM"
        ),
    ),
    dict(
        id="amenity_sapphire",
        name="Sapphire Meeting Room",
        description="10-seat meeting room with video conferencing",
        type="Meeting room",
        building="Tower A",
        floor=8,
        capacity=10,
        default_duration_minutes=60,
        minimum_duration_minutes=30,
        maximum_duration_minutes=180,
        allowed_durations=[30, 60, 90, 120, 180],
        working_hours_start="08:00",
        working_hours_end="20:00",
        is_paid=False,
        credit_cost=0,
        max_bookings_per_user=3,
        advance_booking_hours=14 * 24,
        guideline=(
            "Maximum booking duration: 3 hours\nMaximum attendees: 12\n"
            "External guests: Allowed with notice\nFood: Allowed\n"
            "Available Monday-Friday\nOperating hours: 8 AM-8 PM"
        ),
    ),
    dict(
        id="amenity_ruby",
        name="Ruby Meeting Room",
        description="4-seat huddle room",
        type="Meeting room",
        building="Tower A",
        floor=6,
        capacity=4,
        default_duration_minutes=60,
        minimum_duration_minutes=30,
        maximum_duration_minutes=60,
        allowed_durations=[30, 60],
        working_hours_start="08:00",
        working_hours_end="20:00",
        is_paid=False,
        credit_cost=0,
        max_bookings_per_user=3,
        advance_booking_hours=7 * 24,
        guideline=(
            "Maximum booking duration: 1 hour\nMaximum attendees: 4\n"
            "External guests: Not allowed\nFood: Not allowed\n"
            "Available Monday-Friday\nOperating hours: 8 AM-8 PM"
        ),
    ),
    dict(
        id="amenity_diamond",
        name="Diamond Conference Room",
        description="15-seat conference room with AV desk",
        type="Conference room",
        building="Tower A",
        floor=12,
        capacity=15,
        default_duration_minutes=60,
        minimum_duration_minutes=60,
        maximum_duration_minutes=240,
        allowed_durations=[60, 120, 180, 240],
        working_hours_start="08:00",
        working_hours_end="20:00",
        is_paid=True,
        credit_cost=10,
        max_bookings_per_user=3,
        advance_booking_hours=30 * 24,
        guideline=(
            "Maximum booking duration: 4 hours\nMaximum attendees: 15\n"
            "External guests: Allowed with notice\nFood: Allowed\n"
            "Available Monday-Friday\nOperating hours: 8 AM-8 PM\n"
            "Approval required for bookings over 2 hours"
        ),
    ),
    dict(
        id="amenity_gym",
        name="Gym",
        description="Cardio and strength floor with showers",
        type="Fitness",
        building="Tower A",
        floor=2,
        capacity=10,
        default_duration_minutes=60,
        minimum_duration_minutes=60,
        maximum_duration_minutes=60,
        allowed_durations=[60],
        working_hours_start="06:00",
        working_hours_end="22:00",
        is_paid=True,
        credit_cost=10,
        max_bookings_per_user=1,
        advance_booking_hours=7 * 24,
        guideline=(
            "Maximum booking duration: 1 hour\nMaximum attendees: 1\n"
            "External guests: Not allowed\nFood: Not allowed\n"
            "Available all days\nOperating hours: 6 AM-9 PM"
        ),
        eligible_roles=["employee", "manager"],
    ),
    dict(
        id="amenity_theater",
        name="Theater",
        description="30-seat screening theater",
        type="Theater",
        building="Tower A",
        floor=1,
        capacity=30,
        default_duration_minutes=120,
        minimum_duration_minutes=60,
        maximum_duration_minutes=180,
        allowed_durations=[60, 120, 180],
        working_hours_start="10:00",
        working_hours_end="22:00",
        is_paid=True,
        credit_cost=20,
        max_bookings_per_user=1,
        advance_booking_hours=30 * 24,
        guideline=(
            "Maximum booking duration: 3 hours\nMaximum attendees: 30\n"
            "External guests: Allowed with notice\nFood: Allowed\n"
            "Available all days\nOperating hours: 10 AM-10 PM\nApproval required"
        ),
    ),
    dict(
        id="amenity_tabletennis",
        name="Table Tennis",
        description="Two table tennis boards in the lounge",
        type="Recreation",
        building="Tower A",
        floor=2,
        capacity=4,
        default_duration_minutes=30,
        minimum_duration_minutes=30,
        maximum_duration_minutes=30,
        allowed_durations=[30],
        working_hours_start="08:00",
        working_hours_end="20:00",
        is_paid=True,
        credit_cost=2,
        max_bookings_per_user=2,
        advance_booking_hours=7 * 24,
        is_active=False,
        guideline=(
            "Maximum booking duration: 30 minutes\nMaximum attendees: 4\n"
            "External guests: Not allowed\nFood: Not allowed\n"
            "Available all days\nOperating hours: 8 AM-8 PM"
        ),
    ),
]


def seed(session: Session) -> None:
    _clear(session)

    chirag = User(
        id="usr_chirag",
        name="Chirag",
        email="chirag@google.com",
        company="Google",
        building="Tower A",
        floor=8,
        role=UserRole.employee,
        is_active=True,
    )
    rahul = User(
        id="usr_rahul",
        name="Rahul",
        email="rahul@google.com",
        company="Google",
        building="Tower A",
        floor=8,
        role=UserRole.employee,
        is_active=True,
    )
    guest = User(
        id="usr_guest",
        name="Guest",
        email="guest@amenityos.local",
        company="Guest",
        building="Tower A",
        floor=1,
        role=UserRole.guest,
        is_active=True,
    )
    session.add_all([chirag, rahul, guest])
    session.commit()

    for a in AMENITIES:
        fields = {k: v for k, v in a.items() if k not in ("guideline", "eligible_roles")}
        fields.setdefault("is_active", True)
        amenity = Amenity(**fields)
        session.add(amenity)
        session.commit()

        session.add(
            AmenityGuideline(
                amenity_id=amenity.id,
                document_name=f"{amenity.id}-guidelines.md",
                content=a["guideline"],
            )
        )
        for role in a.get("eligible_roles", []):
            session.add(
                AmenityRule(amenity_id=amenity.id, rule_type=RuleType.eligible_role, rule_value=role)
            )
        session.commit()

    _grant_credits(session, chirag.id, 24)
    _grant_credits(session, rahul.id, 5)

    now = datetime.now(timezone.utc)
    tomorrow = (now + timedelta(days=1)).replace(minute=0, second=0, microsecond=0)

    create_booking(
        session,
        user_id=chirag.id,
        amenity_id="amenity_emerald",
        start_time=tomorrow.replace(hour=15),
        duration_minutes=60,
        attendee_count=5,
        attendee_ids=[],
        idempotency_key=f"seed-{uuid.uuid4().hex[:8]}",
    )
    create_booking(
        session,
        user_id=rahul.id,
        amenity_id="amenity_ruby",
        start_time=tomorrow.replace(hour=11),
        duration_minutes=60,
        attendee_count=3,
        attendee_ids=[],
        idempotency_key=f"seed-{uuid.uuid4().hex[:8]}",
    )


def main() -> None:
    init_db()
    with Session(engine) as session:
        seed(session)
    print("Seed complete: 3 users, 7 amenities, 2 bookings.")


if __name__ == "__main__":
    main()
