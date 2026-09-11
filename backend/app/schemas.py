from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from .models import BookingStatus, TransactionType, UserRole


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
