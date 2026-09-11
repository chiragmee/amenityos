from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    """Naive UTC 'now' — SQLite round-trips datetimes as naive, so every
    datetime this app touches is treated as naive-UTC for consistency."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def to_naive_utc(dt: datetime) -> datetime:
    """Normalize an aware or naive datetime to naive UTC. Incoming request
    datetimes may carry an offset (e.g. parsed from '...Z'); values loaded
    back from SQLite never do. Everything downstream assumes naive-UTC."""
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


class UserRole(str, Enum):
    employee = "employee"
    manager = "manager"
    admin = "admin"
    guest = "guest"


class BookingStatus(str, Enum):
    confirmed = "confirmed"
    cancelled = "cancelled"
    completed = "completed"


class TransactionType(str, Enum):
    debit = "debit"
    credit = "credit"
    refund = "refund"


class RuleType(str, Enum):
    eligible_company = "eligible_company"
    eligible_role = "eligible_role"
    allowed_weekday = "allowed_weekday"
    max_bookings_per_day = "max_bookings_per_day"


class AgentSessionStatus(str, Enum):
    active = "active"
    closed = "closed"


class AgentMessageRole(str, Enum):
    user = "user"
    assistant = "assistant"
    tool = "tool"


class AuditResult(str, Enum):
    success = "success"
    failure = "failure"


class User(SQLModel, table=True):
    id: str = Field(primary_key=True)
    name: str
    email: str = Field(unique=True, index=True)
    company: str
    building: str
    floor: int
    role: UserRole = Field(default=UserRole.employee)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=utcnow)


class Amenity(SQLModel, table=True):
    id: str = Field(primary_key=True)
    name: str
    description: str
    type: str
    building: str
    floor: int
    capacity: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None

    default_duration_minutes: int
    minimum_duration_minutes: int
    maximum_duration_minutes: int
    allowed_durations: list[int] = Field(sa_column=Column(JSON))

    working_hours_start: str  # "HH:MM", 24h
    working_hours_end: str  # "HH:MM", 24h

    is_paid: bool = Field(default=False)
    credit_cost: int = Field(default=0)

    max_bookings_per_user: int = Field(default=3)
    advance_booking_hours: int = Field(default=24 * 14)
    cancellation_window_minutes: int = Field(default=30)

    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)


class AmenityRule(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    amenity_id: str = Field(foreign_key="amenity.id", index=True)
    rule_type: RuleType
    rule_value: str
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)


class AmenityGuideline(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    amenity_id: str = Field(foreign_key="amenity.id", index=True)
    document_name: str
    document_version: str = Field(default="v1")
    content: str
    effective_from: Optional[datetime] = None
    effective_to: Optional[datetime] = None
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)


class Booking(SQLModel, table=True):
    id: str = Field(primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    amenity_id: str = Field(foreign_key="amenity.id", index=True)
    start_time: datetime
    end_time: datetime
    status: BookingStatus = Field(default=BookingStatus.confirmed)
    attendee_count: int
    idempotency_key: str = Field(unique=True, index=True)
    access_token_id: Optional[str] = None
    created_at: datetime = Field(default_factory=utcnow)
    confirmed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None


class BookingAttendee(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    booking_id: str = Field(foreign_key="booking.id", index=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    created_at: datetime = Field(default_factory=utcnow)


class CreditLedger(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    booking_id: Optional[str] = Field(default=None, foreign_key="booking.id")
    transaction_type: TransactionType
    amount: int  # positive = credit added, negative = spend
    balance_after: int
    created_at: datetime = Field(default_factory=utcnow)


class AgentSession(SQLModel, table=True):
    id: str = Field(primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    status: AgentSessionStatus = Field(default=AgentSessionStatus.active)
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)


class AgentMessage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: str = Field(foreign_key="agentsession.id", index=True)
    role: AgentMessageRole
    content: str
    timestamp: datetime = Field(default_factory=utcnow)


class AgentTrace(SQLModel, table=True):
    """One row per agent turn, per docs/12-observability.md's "Agent trace"
    fields — not the same thing as AuditLog (that's the booking-engine's
    business audit trail; this is AI/ops observability of the agent loop
    itself: tokens, tool latencies, retrieval, and failure modes)."""

    id: str = Field(primary_key=True)
    session_id: str = Field(foreign_key="agentsession.id", index=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    timestamp: datetime = Field(default_factory=utcnow)
    user_message: str
    model: str
    input_tokens: int = 0
    output_tokens: int = 0
    # Each entry: {tool_name, duration_ms, result_status, error_code, booking_id}
    tool_calls: list[dict] = Field(default_factory=list, sa_column=Column(JSON))
    retrieval_query: Optional[str] = None
    retrieved_chunk_ids: Optional[list[str]] = Field(default=None, sa_column=Column(JSON))
    final_response: str
    success: bool
    error_code: Optional[str] = None
    total_latency_ms: int = 0


class AuditLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[str] = Field(default=None, foreign_key="user.id")
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    result: AuditResult
    log_metadata: Optional[str] = None
    created_at: datetime = Field(default_factory=utcnow)
