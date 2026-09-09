# 09 — Booking Lifecycle

## Booking state machine

```text
REQUESTED
   |
   v
VALIDATING
   |
   +----> REJECTED
   |
   v
AVAILABLE
   |
   +----> UNAVAILABLE
   |
   v
AWAITING_CONFIRMATION (paid only)
   |
   +----> CANCELLED
   |
   v
CREATING
   |
   +----> FAILED
   |
   v
CONFIRMED
   |
   v
ACTIVE
   |
   v
COMPLETED
```

A cancellation path can exist from appropriate active states.

## Free booking

```text
request
→ resolve parameters
→ eligibility
→ capacity/rules
→ availability
→ create booking
→ generate access
→ confirmed
```

## Paid booking

```text
request
→ resolve parameters
→ eligibility
→ capacity/rules
→ availability
→ calculate cost
→ check balance
→ show price
→ explicit confirmation
→ transactional booking + credit deduction
→ access
→ confirmed
```

## Atomicity

Paid booking must ensure that:

- booking creation
- credit deduction
- booking confirmation

are consistent.

Never end up with:
- credits deducted but no booking
- booking created but credits not deducted

Use a database transaction.

## Idempotency

Every state-changing booking request should include an idempotency key.

If the same request is repeated, return the existing booking instead of creating another one.

## Concurrency

Two users may request the same resource simultaneously.

The database/booking service must enforce conflict detection atomically.

The LLM cannot guarantee concurrency safety.

## Access credential

Only generate an access credential for a successfully confirmed booking.

Credential validity must be checked against the booking's:
- status
- amenity
- start/end time

## Cancelled booking

A cancelled booking must not provide access.

Credit refund behavior should be determined by the configured cancellation policy and implemented deterministically.
