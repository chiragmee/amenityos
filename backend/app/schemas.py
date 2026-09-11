import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from .models import BookingStatus, TransactionType, UserRole

_HHMM_RE = re.compile(r"^([01]\d|2[0-3]):([0-5]\d)$")


def _validate_hhmm(value: Optional[str]) -> Optional[str]:
    if value is not None and not _HHMM_RE.match(value):
        raise ValueError(f"'{value}' is not a valid HH:MM 24-hour time")
    return value


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    company: str
    building: str
    floor: int
    role: UserRole
    is_active: bool
    credits: int


class AmenityOut(BaseModel):
    id: str
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
    allowed_durations: list[int]
    working_hours_start: str
    working_hours_end: str
    is_paid: bool
    credit_cost: int
    max_bookings_per_user: int
    advance_booking_hours: int
    cancellation_window_minutes: int
    is_active: bool
    # Real AmenityRule rows, previously fetched but never exposed via the API.
    eligible_roles: list[str] = Field(default_factory=list)
    eligible_companies: list[str] = Field(default_factory=list)
    allowed_weekdays: list[str] = Field(default_factory=list)


class AmenityCreateRequest(BaseModel):
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
    allowed_durations: list[int] = Field(default_factory=list)
    working_hours_start: str
    working_hours_end: str
    is_paid: bool = False
    credit_cost: int = 0
    max_bookings_per_user: int = 3
    advance_booking_hours: int = 24 * 14
    cancellation_window_minutes: int = 30
    eligible_roles: list[str] = Field(default_factory=list)
    eligible_companies: list[str] = Field(default_factory=list)
    allowed_weekdays: list[str] = Field(default_factory=list)
    guideline: Optional[str] = None

    _validate_start = field_validator("working_hours_start")(_validate_hhmm)
    _validate_end = field_validator("working_hours_end")(_validate_hhmm)


class AmenityUpdateRequest(BaseModel):
    """All fields optional — PATCH semantics. Only provided fields change."""

    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    building: Optional[str] = None
    floor: Optional[int] = None
    capacity: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None
    default_duration_minutes: Optional[int] = None
    minimum_duration_minutes: Optional[int] = None
    maximum_duration_minutes: Optional[int] = None
    allowed_durations: Optional[list[int]] = None
    working_hours_start: Optional[str] = None
    working_hours_end: Optional[str] = None
    is_paid: Optional[bool] = None
    credit_cost: Optional[int] = None
    max_bookings_per_user: Optional[int] = None
    advance_booking_hours: Optional[int] = None
    cancellation_window_minutes: Optional[int] = None
    is_active: Optional[bool] = None
    eligible_roles: Optional[list[str]] = None
    eligible_companies: Optional[list[str]] = None
    allowed_weekdays: Optional[list[str]] = None
    guideline: Optional[str] = None

    _validate_start = field_validator("working_hours_start")(_validate_hhmm)
    _validate_end = field_validator("working_hours_end")(_validate_hhmm)


class GuidelineOut(BaseModel):
    document_name: str
    document_version: str
    content: str
    effective_from: Optional[datetime]
    effective_to: Optional[datetime]


class AmenityPolicyOut(BaseModel):
    amenity_id: str
    guidelines: list[GuidelineOut]


class AvailabilityCheckRequest(BaseModel):
    amenity_id: str
    start_time: datetime
    duration_minutes: int = Field(gt=0)
    attendee_count: int = Field(gt=0)


class ConflictWindow(BaseModel):
    start_time: datetime
    end_time: datetime


class AvailabilityCheckResponse(BaseModel):
    available: bool
    conflicts: list[ConflictWindow]


class BookingValidateRequest(BaseModel):
    user_id: str
    amenity_id: str
    start_time: datetime
    duration_minutes: int = Field(gt=0)
    attendee_count: int = Field(gt=0)


class BookingValidateResponse(BaseModel):
    valid: bool
    error_code: Optional[str] = None
    message: Optional[str] = None
    is_paid: bool
    credit_cost: int
    current_balance: int
    sufficient_credits: bool


class BookingCreateRequest(BaseModel):
    user_id: str
    amenity_id: str
    start_time: datetime
    duration_minutes: int = Field(gt=0)
    attendee_count: int = Field(gt=0)
    attendee_ids: list[str] = Field(default_factory=list)
    idempotency_key: str


class BookingOut(BaseModel):
    id: str
    user_id: str
    amenity_id: str
    start_time: datetime
    end_time: datetime
    status: BookingStatus
    attendee_count: int
    credits_deducted: int
    access_token: Optional[str] = None
    created_at: datetime


class BookingCancelRequest(BaseModel):
    user_id: str


class BookingCancelResponse(BaseModel):
    id: str
    status: BookingStatus
    cancelled_at: Optional[datetime]
    refunded_credits: int


class LedgerEntryOut(BaseModel):
    id: int
    transaction_type: TransactionType
    amount: int
    balance_after: int
    booking_id: Optional[str]
    created_at: datetime


class CreditsOut(BaseModel):
    user_id: str
    balance: int
    ledger: list[LedgerEntryOut]


class AccessVerifyRequest(BaseModel):
    token: str


class AccessVerifyResponse(BaseModel):
    allowed: bool
    booking_id: Optional[str] = None
    amenity: Optional[str] = None
    valid_until: Optional[datetime] = None
    reason: Optional[str] = None
