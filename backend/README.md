# Nookly Backend

The deterministic booking engine (validation + atomic paid-booking
creation + idempotency), plus the AI layers built on top of it: a
Gemini-backed tool-calling agent (`app/agent/`), RAG policy retrieval
(`app/rag/`), voice transcription (`app/voice/`), and observability +
evaluation (`app/admin/`, `app/models.py::AgentTrace`, `eval/`). See the
root `README.md`'s "AI Strategy" section for how and why each layer was
built. The engine itself was built and tested completely on its own
first — every agent tool is a thin wrapper over it, never new logic.

## Stack

Python 3, FastAPI, SQLModel (SQLAlchemy + Pydantic), SQLite locally /
Postgres in production, Gemini API (`google-genai`), Qdrant (embedded).

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

25 tests against an isolated in-memory SQLite database (never touches
`amenityos.db`): the 10 required booking scenarios (free booking, paid
booking, insufficient credits, capacity violation, eligibility violation,
outside working hours, invalid duration, conflicting booking, duplicate
booking request, idempotent retry), cancellation + refund logic, amenity
CRUD, and other guardrail cases. Separately, `python -m eval.run_eval`
runs a 29-case suite against the *live* Gemini agent (see the root
README's AI Strategy section) — that one needs a running server and
`GEMINI_API_KEY`, and is not part of the pytest suite.

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
- `AgentSession` / `AgentMessage` now persist every real agent conversation
  (`app/agent/orchestrator.py`) — they were unused placeholders early in
  the build, per the requested entity list, before the agent existed.
- Access tokens are HMAC-signed opaque strings (`booking_id.signature`),
  not JWTs — no expiry claim baked in; expiry is checked against the
  booking's own `end_time` at verification time instead.
