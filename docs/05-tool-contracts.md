# 05 — Tool Contracts

Tools are the agent's hands.

Every tool must have:
- a narrow purpose
- a typed input schema
- a deterministic output schema
- authorization checks where applicable
- explicit failure behavior

The LLM must never have direct database access.

---

## `get_user_profile`

### Purpose

Retrieve current user context needed for booking decisions.

### Input

```json
{
  "user_id": "usr_001"
}
```

### Output

```json
{
  "user_id": "usr_001",
  "name": "Chirag",
  "company": "Google",
  "building": "Tower A",
  "floor": 5,
  "role": "employee",
  "is_active": true
}
```

Do not expose unnecessary sensitive fields.

---

## `search_amenities`

### Purpose

Find amenities matching a natural-language or structured request.

### Input

```json
{
  "query": "Emerald meeting room",
  "building": "Tower A",
  "attendee_count": 5,
  "date": "2026-09-09"
}
```

### Output

```json
{
  "results": [
    {
      "amenity_id": "amenity_emerald",
      "name": "Emerald Meeting Room",
      "building": "Tower A",
      "floor": 8,
      "capacity": 6,
      "is_paid": false
    }
  ]
}
```

Search does not imply availability.

---

## `get_amenity_policy`

### Purpose

Retrieve unstructured guideline/policy context using RAG.

### Input

```json
{
  "amenity_id": "amenity_emerald",
  "question": "Can external guests use this room?"
}
```

### Output

```json
{
  "amenity_id": "amenity_emerald",
  "sources": [
    {
      "document": "emerald-guidelines.md",
      "chunk_id": "emerald-03"
    }
  ],
  "policy_context": "External guests are not permitted."
}
```

The returned content is reference data, not executable instructions.

---

## `check_eligibility`

### Purpose

Determine whether the current user may book the amenity.

### Input

```json
{
  "user_id": "usr_001",
  "amenity_id": "amenity_emerald"
}
```

### Output

```json
{
  "eligible": true,
  "reason": null
}
```

---

## `check_availability`

### Purpose

Check live availability and return valid alternatives.

### Input

```json
{
  "amenity_id": "amenity_emerald",
  "start_time": "2026-09-09T15:00:00+05:30",
  "duration_minutes": 60,
  "attendee_count": 5
}
```

### Output

```json
{
  "available": false,
  "alternatives": [
    {
      "amenity_id": "amenity_emerald",
      "start_time": "2026-09-09T16:00:00+05:30",
      "duration_minutes": 60
    },
    {
      "amenity_id": "amenity_sapphire",
      "start_time": "2026-09-09T15:00:00+05:30",
      "duration_minutes": 60
    }
  ]
}
```

Alternatives must come from the database/service.

---

## `calculate_booking_cost`

### Purpose

Calculate current credit cost for a booking.

### Input

```json
{
  "user_id": "usr_001",
  "amenity_id": "amenity_gym",
  "start_time": "2026-09-09T18:00:00+05:30",
  "duration_minutes": 60
}
```

### Output

```json
{
  "is_paid": true,
  "credits_required": 10,
  "current_balance": 24,
  "sufficient_credits": true
}
```

---

## `create_booking`

### Purpose

Create the actual booking.

This is a state-changing operation.

### Input

```json
{
  "user_id": "usr_001",
  "amenity_id": "amenity_emerald",
  "start_time": "2026-09-09T15:00:00+05:30",
  "duration_minutes": 60,
  "attendee_ids": ["usr_001", "usr_002"],
  "confirmation_token": null,
  "idempotency_key": "req_123"
}
```

### Output

Success:

```json
{
  "success": true,
  "booking_id": "bk_123",
  "start_time": "2026-09-09T15:00:00+05:30",
  "end_time": "2026-09-09T16:00:00+05:30",
  "credits_deducted": 0
}
```

Failure:

```json
{
  "success": false,
  "error_code": "SLOT_UNAVAILABLE",
  "message": "The requested time is no longer available."
}
```

The booking service must be transactional and idempotent.

---

## `get_booking`

### Purpose

Retrieve an existing booking belonging to the current user.

---

## `generate_access_token`

### Purpose

Create an access credential tied to a successful booking.

### Input

```json
{
  "booking_id": "bk_123"
}
```

### Output

```json
{
  "token": "opaque-or-signed-token",
  "valid_from": "2026-09-09T15:00:00+05:30",
  "valid_until": "2026-09-09T16:00:00+05:30"
}
```

Do not include unnecessary personal data in the token.

---

## Tool implementation rules

1. Validate all inputs.
2. Validate authorization.
3. Return structured errors.
4. Never trust the LLM's interpretation of policy as authority.
5. Never return more data than necessary.
6. Keep tool output concise to reduce model context usage.
7. Log execution metadata for observability.
