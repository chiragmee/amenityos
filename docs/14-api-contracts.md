# 14 — API Contracts

This document defines the service boundary between the frontend and backend.

**Status:** the routes below are implemented in `backend/` (deterministic
booking engine only — no `/agent` or `/voice` routes yet, since the LLM and
STT are not connected). See `backend/README.md` for how this diverged from
an earlier draft of this doc (no `/api` prefix, a couple of endpoint shapes
changed, two endpoints added).

## Health

`GET /health`

Response:

```json
{
  "status": "ok"
}
```

## Users

`GET /users/{user_id}`

`GET /users/{user_id}/bookings`

`GET /users/{user_id}/credits`

## Amenities

`GET /amenities`

`GET /amenities/{amenity_id}`

`GET /amenities/{amenity_id}/policy` — returns the amenity's guideline
documents verbatim. No RAG/semantic retrieval yet; that lands with `docs/07-rag.md`.

## Availability

`POST /availability/check`

Request:

```json
{
  "amenity_id": "amenity_emerald",
  "start_time": "2026-09-09T15:00:00Z",
  "duration_minutes": 60,
  "attendee_count": 5
}
```

Response:

```json
{
  "available": false,
  "conflicts": [
    { "start_time": "2026-09-09T15:00:00", "end_time": "2026-09-09T16:00:00" }
  ]
}
```

## Booking validation

`POST /bookings/validate`

Returns whether the requested booking is valid before creation, along with
cost/balance info — without creating anything.

## Booking creation

`POST /bookings`

Request:

```json
{
  "user_id": "usr_001",
  "amenity_id": "amenity_emerald",
  "start_time": "2026-09-09T15:00:00Z",
  "duration_minutes": 60,
  "attendee_ids": [],
  "idempotency_key": "req_123"
}
```

Replaying the same `idempotency_key` returns the original booking instead
of creating a second one.

`GET /bookings/{booking_id}`

## Access verification

`POST /access/verify`

Request:

```json
{ "token": "bk_123.<hmac-signature>" }
```

Success:

```json
{
  "allowed": true,
  "booking_id": "bk_123",
  "amenity": "Emerald Meeting Room",
  "valid_until": "2026-09-09T16:00:00"
}
```

Failure:

```json
{
  "allowed": false,
  "reason": "TOKEN_EXPIRED"
}
```

`reason` is one of `TOKEN_INVALID`, `TOKEN_EXPIRED`, `BOOKING_CANCELLED`.

## Not yet implemented

These are specified elsewhere in `docs/` but have no route yet, pending the
agent/voice work:

- `POST /agent/chat` (`docs/03-system-prompt.md`, `docs/05-tool-contracts.md`)
- `POST /voice/transcribe` (`docs/08-voice-pipeline.md`)

## Error format

```json
{
  "error": {
    "code": "SLOT_UNAVAILABLE",
    "message": "The requested time is no longer available."
  }
}
```

Error codes in use: `USER_NOT_FOUND`, `USER_INACTIVE`, `AMENITY_NOT_FOUND`,
`AMENITY_INACTIVE`, `NOT_ELIGIBLE`, `CAPACITY_EXCEEDED`,
`OUTSIDE_WORKING_HOURS`, `INVALID_DURATION`,
`ADVANCE_BOOKING_WINDOW_EXCEEDED`, `BOOKING_LIMIT_EXCEEDED`,
`SLOT_UNAVAILABLE`, `INSUFFICIENT_CREDITS`, `BOOKING_NOT_FOUND`.
