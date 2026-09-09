# 14 — API Contracts

This document defines the service boundary between the frontend and backend.

## Health

`GET /api/health`

Response:

```json
{
  "status": "ok"
}
```

## Agent

`POST /api/agent/chat`

Request:

```json
{
  "session_id": "session_001",
  "user_id": "usr_001",
  "message": "Book Emerald at 3 PM for five people."
}
```

Response:

```json
{
  "message": "Done. Emerald Meeting Room is booked from 3:00 to 4:00 PM.",
  "status": "completed",
  "booking": {
    "booking_id": "bk_123",
    "amenity_id": "amenity_emerald"
  }
}
```

## Voice transcription

`POST /api/voice/transcribe`

Input:
audio multipart/form-data

Response:

```json
{
  "text": "Book Emerald Meeting Room today at 3 PM for five people."
}
```

## Amenities

`GET /api/amenities`

`GET /api/amenities/{amenity_id}`

## Availability

`POST /api/availability/check`

Request:

```json
{
  "amenity_id": "amenity_emerald",
  "start_time": "2026-09-09T15:00:00+05:30",
  "duration_minutes": 60,
  "attendee_count": 5
}
```

## Booking validation

`POST /api/bookings/validate`

Returns whether the requested booking is valid before creation.

## Booking creation

`POST /api/bookings`

Request:

```json
{
  "user_id": "usr_001",
  "amenity_id": "amenity_emerald",
  "start_time": "2026-09-09T15:00:00+05:30",
  "duration_minutes": 60,
  "attendee_ids": [],
  "idempotency_key": "req_123"
}
```

## User bookings

`GET /api/users/{user_id}/bookings`

## Credits

`GET /api/users/{user_id}/credits`

## Access verification

`GET /api/access/verify/{token}`

Success:

```json
{
  "allowed": true,
  "booking_id": "bk_123",
  "amenity": "Emerald Meeting Room",
  "valid_until": "2026-09-09T16:00:00+05:30"
}
```

Failure:

```json
{
  "allowed": false,
  "reason": "TOKEN_EXPIRED"
}
```

## Error format

Prefer:

```json
{
  "error": {
    "code": "SLOT_UNAVAILABLE",
    "message": "The requested time is no longer available."
  }
}
```

Error codes should be stable enough for frontend behavior.
