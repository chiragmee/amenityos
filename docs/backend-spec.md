# AmenityOS — Backend Spec

Describes the backend AmenityOS will eventually need to serve the frontend
built against `frontend-spec.md`. **Not implemented in this pass** — this
document exists so the frontend's mock data layer is designed against a
real target instead of drifting.

## Stack

- Python, FastAPI.
- SQLite (single file, no multi-tenancy) as system of record.
- Qdrant as a secondary index for semantic amenity search — never the
  source of truth, always rebuildable from SQLite.
- Gemini API for NL understanding / response generation (see
  `agent-spec.md`).
- Local Whisper for speech-to-text (see Voice below).
- No auth in MVP (matches product-spec's explicit scope cut) — every
  endpoint operates as the single hardcoded demo user until auth is added.
- No multi-agent framework, no LangChain, unless a specific capability
  below turns out to need something plain FastAPI + the Gemini SDK can't
  reasonably do. Default assumption: a single orchestrator function per
  request (see `agent-spec.md`) beats a framework at this scale.

## Service boundary

One FastAPI service. No microservices — amenities, bookings, credits, and
the assistant endpoint all live in one app talking to one SQLite file,
because splitting them would add deployment/ops surface with no scaling
need at this stage.

## REST surface (indicative — finalize alongside implementation)

```
GET    /api/me                        current user (identity, credits, eligibility)

GET    /api/amenities                 list, filterable by active/type/building
GET    /api/amenities/{id}
POST   /api/amenities                 admin create
PATCH  /api/amenities/{id}            admin update (schedule/rules/pricing/guidelines)
POST   /api/amenities/{id}/deactivate

GET    /api/amenities/{id}/availability?date=   slots for a given day

GET    /api/bookings                  current user's bookings (upcoming+past)
POST   /api/bookings                  create directly (bypasses assistant — used by
                                       "Book" buttons on Amenities cards once a slot
                                       is chosen without going through NL)
POST   /api/bookings/{id}/cancel
GET    /api/bookings/{id}/pass        QR payload + validity

GET    /api/credits                   balance, allowance, ledger

POST   /api/assistant/message         { text } -> assistant turn (see agent-spec.md);
                                       may create a booking as a side effect
POST   /api/voice/transcribe          { audio } -> { text }  (Whisper, see below)
```

Response shapes should mirror `data-model.md` entities directly — the
frontend's mock objects in this pass are written to match those shapes
already, so wiring up real fetches later is a data-layer swap, not a
component rewrite.

## Availability engine

Given an amenity + requested window: check the amenity's schedule fields
(working hours, available days, min/max/allowed durations, advance booking
window) and existing non-cancelled bookings for conflicts. Pure function
over SQLite reads — no external calls, no LLM involvement. This is what
the "Checking availability…" step and the Assistant's alternative-slot
options are backed by.

## Rules / eligibility engine

Given a user + amenity + requested attendee count/window: check capacity,
`maxActiveBookingsPerUser`, `bookingFrequency`, `eligibilityRule`, and the
amenity's free-text `guidelines`. The structured fields are checked in
plain code; `guidelines` (free text) is where an LLM is actually needed —
see `agent-spec.md` for how that's resolved without turning the whole
pipeline into an LLM call.

## Credits engine

- Balance = sum of `credit_ledger` rows for the user (no separate mutable
  balance column — avoids drift between a cached number and history).
- Booking a costed amenity inserts a negative ledger row **atomically
  with** the booking insert (same DB transaction) — a booking must never
  exist without its corresponding spend, and vice versa.
- Monthly allowance reset: a scheduled job (cron, or a lazy check-on-read
  for MVP simplicity) inserts a `+monthlyAllowance` row on the 1st if one
  doesn't already exist for the month.
- Insufficient-credits path never creates a booking — matches the "low
  credits" Assistant scenario, which explicitly states "nothing was
  booked and no credits were used."

## Access pass issuance

On booking confirmation, generate an opaque signed token (e.g. HMAC of
`bookingId + validUntil` with a server secret) as `qrPayload`. Real
validation (a scanner endpoint) is out of scope for MVP — no entrance
hardware exists yet — but the payload should already be structured so a
future `/api/pass/validate` endpoint can verify it without a schema
change.

## Voice (local Whisper)

- `POST /api/voice/transcribe` accepts short audio clips (press-to-talk,
  matching the frontend's hold-to-speak model), runs local Whisper
  (`whisper.cpp` or `openai-whisper` small/base model — pick at
  implementation time based on latency on target hardware), returns text.
- Runs synchronously in-process for MVP; no queue/worker needed at this
  scale. Revisit only if transcription latency makes the request-response
  cycle feel broken.
- Whisper's job stops at transcription. The resulting text is handed to
  the same `/api/assistant/message` path as typed input — voice and text
  input converge immediately, matching the frontend's "listening → same
  processing pipeline as typed" flow.

## What's deliberately not built yet

- Auth/session/roles.
- Entrance scanner / pass validation endpoint.
- Real calendar export (`Add to calendar` is a stub button client-side
  until this exists).
- Admin notification delivery for credit top-up requests ("Priya N. will
  review…") — MVP can log/store the request; email/Slack delivery is a
  later integration, not a schema-affecting decision now.
- Horizontal scaling / multi-instance concerns — single SQLite file
  assumes single backend process for MVP.
