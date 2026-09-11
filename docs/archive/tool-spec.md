# Nookly — Tool Spec

Discrete tools the agent orchestrator (`agent-spec.md`) calls. Each tool is
a plain Python function with a typed signature — exposed to Gemini as
function-calling declarations where the model needs to invoke them
directly (intent extraction, amenity search), and called directly from
orchestrator code elsewhere (availability, rules, booking — these don't
need the model in the loop, per `agent-spec.md`'s step breakdown).

**Not implemented in this pass.** This is the contract the backend will
implement against.

## `search_amenities`

Semantic lookup when a request doesn't name an amenity exactly.

```
search_amenities(query: str, top_k: int = 5) -> list[AmenityMatch]

AmenityMatch = { amenity_id, name, score, active }
```

Implementation: embed `query`, search the Qdrant `amenities` collection
(see `data-model.md`), filter `active=true`. Called by Gemini during
intent extraction when `amenity_hint` doesn't exact-match a known name.

## `get_amenity`

```
get_amenity(amenity_id: str) -> Amenity | None
```

Plain SQLite read. Full amenity record including schedule/rules/
guidelines fields.

## `check_availability`

```
check_availability(amenity_id: str, start: datetime, end: datetime) -> AvailabilityResult

AvailabilityResult = {
  available: bool,
  conflicts: list[{start, end}],       # existing bookings that overlap
}
```

Plain code — reads amenity schedule constraints + existing bookings.
Deterministic, no model call. Backs pipeline step 2.

## `find_alternatives`

```
find_alternatives(
  amenity_id: str | None,      # same amenity, different time — if set
  min_capacity: int | None,    # different amenity, same time — if set
  start: datetime, end: datetime,
  limit: int = 3
) -> list[AlternativeSlot]

AlternativeSlot = { amenity_id, name, start, end, reason_tag }
                    # reason_tag e.g. "AVAILABLE" / "FITS 8" / "TOO SMALL BY 2"
```

Powers both the "Slot unavailable" (same amenity/other times, or other
amenities/same time) and "Capacity exceeded" (other amenities that fit)
Assistant scenarios. One tool, two calling patterns depending on which
constraint failed.

## `check_rules`

```
check_rules(user_id: str, amenity_id: str, start: datetime, end: datetime,
            attendees: int) -> RulesResult

RulesResult = {
  passed: bool,
  failures: list[str],   # e.g. "capacity_exceeded", "max_active_bookings",
                          #      "not_eligible", "frequency_exceeded"
}
```

Plain code, structured fields only (capacity, `maxActiveBookingsPerUser`,
`bookingFrequency`, `eligibilityRule`). Does not touch `guidelines` — that's
`check_guidelines` below, called separately only if this passes.

## `check_guidelines`

```
check_guidelines(amenity_id: str, request_summary: str) -> GuidelinesResult

GuidelinesResult = { passed: bool, violated_rule: str | None }
```

The one rules-step call that goes through Gemini — interprets the
amenity's free-text `guidelines` against the structured request. Called
only when `check_rules` passes and the amenity has non-empty guidelines.

## `parse_guidelines`

```
parse_guidelines(guidelines_text: str) -> ParsedGuidelines

ParsedGuidelines = { rule_count: int, conflicts: list[str] }
```

Called when an admin saves an amenity's guidelines (not at booking time)
— backs the "N rules parsed · 0 conflicts" indicator on the Admin screen.
Separating this from `check_guidelines` keeps booking-time latency
independent of guideline complexity.

## `check_credits`

```
check_credits(user_id: str, cost: int) -> { sufficient: bool, balance: int }
```

Plain SQLite read (sum of ledger). No model call. Backs pipeline step 4's
pre-booking gate and the "Insufficient credits" scenario.

## `create_booking`

```
create_booking(user_id: str, amenity_id: str, start: datetime, end: datetime,
               attendees: int, created_via: "voice"|"text"|"manual") -> Booking
```

Transactional: inserts booking row, negative credit-ledger row (if
`costCredits > 0`), and issues an access pass, all in one DB transaction.
Never partially succeeds — a booking without its ledger/pass entries (or
vice versa) must not be possible.

## `cancel_booking`

```
cancel_booking(booking_id: str) -> Booking
```

Sets status to `cancelled`. Whether cancellation refunds credits depends
on the amenity's `cancellationPolicy` field — evaluate that here, not by
duplicating the logic elsewhere.

## `transcribe_audio`

```
transcribe_audio(audio_bytes: bytes) -> { text: str }
```

Local Whisper call. Not exposed to Gemini as a function tool — it's the
entry point *before* the orchestrator runs, called directly by the
`/api/voice/transcribe` endpoint, not by the agent mid-reasoning.

## Extraction tool (model-facing, not a backend call)

`extract_intent` isn't a backend tool in the list above — it's the Gemini
call itself (structured-output request), described in `agent-spec.md`
step 1. It's listed here only for completeness of "what talks to Gemini":
`extract_intent` (utterance → intent) and `check_guidelines` /
`parse_guidelines` (rules interpretation) are the three Gemini call sites
in the entire system. Everything else in this file is plain code.
