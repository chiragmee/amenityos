# AmenityOS Backend

The deterministic booking engine. No LLM, no RAG, no voice — those are
specified in `../docs/` but deliberately not wired in yet. This proves the
booking engine (validation + atomic paid-booking creation + idempotency)
works correctly on its own before an agent sits in front of it.

## Stack

Python 3, FastAPI, SQLModel (SQLAlchemy + Pydantic), SQLite.

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Seed demo data

```bash
python -m app.seed
```

Creates 3 users (Chirag/24 credits, Rahul/5 credits, Guest/restricted),
7 amenities matching the frontend's mock data, their rules and guidelines,
and two realistic pre-existing bookings. Re-running it wipes and reseeds.

## Run

```bash
uvicorn app.main:app --reload
```

Interactive docs at `http://localhost:8000/docs`.

## Test

```bash
python -m pytest -v
```

14 tests against an isolated in-memory SQLite database (never touches
`amenityos.db`): the 10 required scenarios (free booking, paid booking,
insufficient credits, capacity violation, eligibility violation, outside
working hours, invalid duration, conflicting booking, duplicate booking
request, idempotent retry) plus 4 bonus cases (inactive amenity, user not
found, tampered access token, validate/create parity).

## Deviations from `docs/14-api-contracts.md`

Built per an explicit, more detailed prompt that superseded the committed
API contract doc in a few places. Noted here per `AGENTS.md`'s rule to
resolve doc/implementation disagreement explicitly rather than silently:

- No `/api` prefix on any route (docs showed `/api/health` etc.) — routes
  here are `/health`, `/amenities`, `/bookings`, etc.
- `POST /access/verify` (token in the request body) instead of the docs'
  `GET /access/verify/{token}`.
- Added `GET /users/{user_id}` and `GET /amenities/{amenity_id}/policy`,
  neither of which were in the original contract doc.
- `AuditLog.metadata` is `AuditLog.log_metadata` in the actual model —
  `metadata` is a reserved attribute name on SQLAlchemy declarative models.

`docs/14-api-contracts.md` has been updated to match reality.

## Known simplifications (MVP, not oversights)

- All datetimes are treated as naive UTC end-to-end (SQLite has no native
  timezone-aware type). No DST/local-time handling — see
  `app/models.py::to_naive_utc`.
- `working_hours` is split into `working_hours_start`/`working_hours_end`
  (`"HH:MM"` strings) rather than the single free-text field the data-model
  doc sketched — needed a parseable shape for deterministic validation.
- No overnight bookings: a booking must start and end on the same calendar
  day within the amenity's working hours.
- `AgentSession` / `AgentMessage` tables exist (per the requested entity
  list) but nothing writes to them yet — there's no agent loop until the
  LLM is connected.
- Access tokens are HMAC-signed opaque strings (`booking_id.signature`),
  not JWTs — no expiry claim baked in; expiry is checked against the
  booking's own `end_time` at verification time instead.
