# 19 — Agent Integration: Phase A Implementation Plan

Concrete plan for the first agent milestone from `docs/18-roadmap.md`: a
real tool-calling text agent, replacing the scripted Home/Assistant demos.
RAG (Phase B), voice (Phase C), and eval/observability (Phase D) are
separate plans that build on this one — not written yet, since B and C
both depend on the `/agent/chat` endpoint this phase produces.

**Status: plan only, nothing built yet.** Written because the user asked
to sit with the plan before implementation starts.

## Scope

**In scope for Phase A:**
- One new backend endpoint: `POST /agent/chat`
- Gemini-backed tool-calling orchestrator wrapping the *existing*
  deterministic engine — no new business logic, only a translation layer
- Multi-turn conversation state (needed for "confirm this paid booking?"
  and clarifying questions), using the `AgentSession`/`AgentMessage`
  tables that already exist in the schema but are currently unused
- Rewiring Home's voice/text box and the Assistant page's 4 scenario
  chips to call this real endpoint

**Explicitly out of scope for Phase A** (separate later plans):
- RAG / Qdrant / real `get_amenity_policy` retrieval — `get_amenity_policy`
  stays a stub (raw guideline text, no semantic search) until Phase B
- Real speech-to-text / TTS — voice stays simulated until Phase C
- Eval suite / tracing — Phase D
- Any change to `booking_engine.py`'s validation logic — Phase A adds a
  translation layer in front of it, it does not touch it

## Why this is smaller than it looks

Every success/failure case the user asked about — insufficient credits,
capacity exceeded, unavailable slot, outside working hours, paid-booking
confirmation — is **already implemented and tested** in
`backend/app/booking_engine.py` (14 passing tests). The agent's job is
not to reimplement these rules; it's to (1) turn a sentence into a
structured tool call, and (2) turn a tool result back into a sentence.
`docs/03-system-prompt.md` already encodes the rules for when to ask vs.
act vs. refuse. This phase is a translation layer, not new product logic.

## Prerequisites (need your input before I start)

1. **Gemini API key.** Needs a Google AI Studio / Vertex account with
   billing enabled. I can't provision this — same pattern as the GitHub/
   Vercel/Supabase/Render tokens earlier: you generate it, I use it only
   to configure the backend's env var, never commit it.
2. **SDK choice.** The current official package is `google-genai`
   (`pip install google-genai`) — I'll verify the exact current API shape
   against its docs at implementation time rather than trust training
   data, since Gemini SDKs have changed shape before.
3. **Where Gemini calls run.** The existing FastAPI backend on Render is
   the natural home (it already has the DB session and the tool
   functions it would call). No new service needed.

## New backend surface

```
backend/app/agent/
  __init__.py
  system_prompt.py     # docs/03, versioned as a constant + version string
  tools.py              # the 9 tool-contract functions, thin wrappers over
                         # booking_engine.py — see mapping below
  schemas.py             # AgentChatRequest/Response, tool call/result shapes
  orchestrator.py        # the agent loop (docs/04)
backend/app/routers/agent.py   # POST /agent/chat
```

### Tool mapping (`docs/05-tool-contracts.md` → existing code)

| Tool | Wraps |
|---|---|
| `get_user_profile` | `session.get(User, id)` (already how `/users/{id}` works) |
| `search_amenities` | Phase A: simple name/type substring match over `Amenity` rows. Real semantic search is Phase B (RAG) — noted in the tool's docstring so it's not forgotten |
| `get_amenity_policy` | Existing `AmenityGuideline` lookup (same as today's `/amenities/{id}/policy`) — stub until Phase B |
| `check_eligibility` | New thin wrapper around the `AmenityRule` role/company check already in `booking_engine.check_eligibility` |
| `check_availability` | Existing `find_conflicts` |
| `calculate_booking_cost` | Existing `get_current_balance` + `Amenity.credit_cost` |
| `create_booking` | Existing `create_booking` (idempotency, atomic credit deduction — unchanged) |
| `get_booking` | Existing `session.get(Booking, id)` |
| `generate_access_token` | Existing `generate_token` — actually redundant, since `create_booking` already issues one; the tool contract can just return the booking's existing token rather than mint a second one |

None of these require new validation logic — they're read-throughs to
code that's already correct and tested.

### Orchestrator loop (per `docs/04-agent-architecture.md`)

```
POST /agent/chat  { session_id, user_id, message }
  -> load last N AgentMessage rows for session_id (conversation history)
  -> append new user message, persist it
  -> call Gemini with: system prompt + history + tool declarations
  -> loop:
       if Gemini returns a tool call:
         execute the matching function from tools.py
         append tool result to context
         call Gemini again
       if Gemini returns final text:
         persist it as an AgentMessage, return to caller
  -> cap at e.g. 6 tool-call rounds per turn (safety valve against loops)
```

This finally gives the `AgentSession`/`AgentMessage` tables (built in the
original backend pass, unused since day one) a real purpose.

### Response shape to the frontend

```json
{
  "session_id": "...",
  "message": "The gym is available from 6:00–7:00 PM. This costs 10 credits...",
  "booking": { "id": "...", "access_token": "..." } | null
}
```

`booking` is populated only when this turn's tool calls actually created
one — lets the frontend show the QR/pass card without re-parsing prose.

## Frontend rewiring

- **Home page**: `useVoiceFlow`'s `onDone` callback stops calling the
  hardcoded Emerald `createRealBooking` and instead calls
  `POST /agent/chat` with whatever was actually typed/spoken. The 4-step
  "Understanding → Availability → Rules → Booking" animation becomes
  cosmetic pacing around one real call rather than a script.
- **Assistant page**: open decision, see below.

## Open decisions for you

1. **Assistant page**: keep the current card-based "pick a scenario chip"
   UI but have each chip send a real canned sentence to the real
   `/agent/chat` (low risk, reuses existing polished UI, reasoning
   becomes real) — **or** replace it with a free-form chat interface
   (more work, more honest about being a general agent, but throws away
   the current UI). I'd default to the first option for Phase A and
   revisit once the agent is proven.
2. **Clarifying questions**: the current UI has no way to show "what
   time would you like?" and let the user answer inline — Phase A's
   multi-turn support makes this possible, but the Home page's UI
   (single input → animation → done) doesn't have a slot for a
   back-and-forth. Needs a small UI addition (a reply box appears if the
   agent's response is a question rather than a completion).
3. **Model routing / cost**: `docs/13` recommends Gemini 2.5 Flash as the
   initial model, no routing until quality is measured — I'd start there
   and not over-engineer a routing layer prematurely.

## Rough sequencing

1. Tool wrappers (`tools.py`) + unit tests against the real DB (fast,
   deterministic, no Gemini calls needed to test this layer)
2. Orchestrator + `/agent/chat`, tested manually with a handful of real
   Gemini calls covering the golden scenarios (free booking, paid
   booking + confirmation, insufficient credits, capacity exceeded,
   unavailable slot, ambiguous request)
3. Frontend rewiring (Home first, Assistant second per the decision above)
4. Deploy, re-verify end-to-end against the live Render/Vercel stack,
   same way every prior phase was verified

Each step ends in a commit, per the usual convention. No step touches
`booking_engine.py`'s validation logic.
