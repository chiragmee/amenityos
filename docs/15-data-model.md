# 15 — Data Model

## User

```text
id
name
email
company
building
floor
role
is_active
created_at
```

## Amenity

```text
id
name
description
type
building
floor
capacity
latitude
longitude
image_url
default_duration_minutes
minimum_duration_minutes
maximum_duration_minutes
allowed_durations
working_hours
is_paid
credit_cost
max_bookings_per_user
advance_booking_hours
cancellation_window_minutes
is_active
created_at
updated_at
```

## AmenityRule

Stores structured booking constraints that should be evaluated deterministically.

```text
id
amenity_id
rule_type
rule_value
created_at
updated_at
```

Examples:
- working hours
- allowed weekdays
- max bookings/day
- eligible company
- eligible role

## AmenityGuideline

Metadata for RAG documents.

```text
id
amenity_id
document_name
document_version
content
effective_from
effective_to
created_at
updated_at
```

## Booking

```text
id
user_id
amenity_id
start_time
end_time
status
attendee_count
idempotency_key
access_token_id
created_at
confirmed_at
cancelled_at
```

## BookingAttendee

```text
booking_id
user_id
created_at
```

## CreditLedger

Use a ledger rather than only mutating a balance.

```text
id
user_id
booking_id
transaction_type
amount
balance_after
created_at
```

This provides auditability.

## AgentSession

```text
id
user_id
created_at
updated_at
status
```

## AgentMessage

```text
id
session_id
role
content
timestamp
```

Do not store hidden chain-of-thought.

## AuditLog

```text
id
user_id
action
entity_type
entity_id
result
metadata
created_at
```

## Relationships

```text
User 1 ---- * Booking
Amenity 1 ---- * Booking
Booking 1 ---- * BookingAttendee
User 1 ---- * CreditLedger
Booking 1 ---- * CreditLedger
Amenity 1 ---- * AmenityRule
Amenity 1 ---- * AmenityGuideline
User 1 ---- * AgentSession
AgentSession 1 ---- * AgentMessage
```
