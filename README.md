# AmenityOS

## AI-Powered Workplace Amenity Booking Agent

AmenityOS is an action-taking AI agent for workplace and commercial-real-estate amenity booking.

Instead of navigating a multi-step booking application, an employee can say or type:

> "Book Emerald Meeting Room today at 3 PM for five people."

The agent interprets the request, identifies the amenity, checks relevant rules, checks live availability, validates eligibility and capacity, handles credits for paid amenities, creates the booking when authorized, generates an access credential/QR code, and reports the actual result.

**Live frontend prototype:** https://frontend-five-dusky-47.vercel.app

## Product thesis

The problem is not that employees cannot book amenities. The problem is that the booking workflow forces users to translate a simple intent into a sequence of UI interactions:

open app → find building/floor → search amenity → pick date → pick time → pick duration → enter attendees → check eligibility → check price → confirm → retrieve access pass.

AmenityOS changes the interaction model from:

**Navigate → search → select → fill → validate → confirm → book**

to:

**Tell the system what you want → the agent performs the workflow.**

## Product landscape

The frontend (built, deployed, running on mock data) implements eight screens, desktop and mobile:

| Screen | What it does |
|---|---|
| **Home** | Hold-to-speak or type a request; watches the agent's request → availability → rules → booking pipeline resolve step by step; shows the resulting confirmation, QR access pass, and upcoming bookings |
| **AI Assistant** | A guided walkthrough of four non-happy-path resolutions the agent must handle: slot unavailable (offers alternatives), paid amenity (asks for confirmation before charging), insufficient credits (blocks the booking, offers to contact an admin), capacity exceeded (offers a bigger room) |
| **Amenities** | Browsable catalog of bookable amenities with live-style availability, capacity, and pricing |
| **My Bookings** | Upcoming and past bookings with status (confirmed / completed / cancelled) |
| **Credits** | Monthly credit allowance, remaining balance, and a spend ledger |
| **Admin** | Configure amenities: schedule, capacity, duration rules, eligibility, pricing, and a plain-language guidelines field the agent reads when resolving requests |
| **Access Pass** | QR credential for an amenity booking, with an active/expired state and countdown |
| **Profile** | Identity, credit summary, eligibility, and voice preference |

The frontend still runs against typed mock data — it isn't wired to the backend yet. The backend's deterministic booking engine (below) is built and tested; connecting the frontend to it, and then layering the agent/voice/RAG stack on top, are the next phases.

## Tech stack

| Layer | Choice | Status |
|---|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS | Built, deployed to Vercel (mock data, not yet wired to the backend) |
| Backend | Python, FastAPI, SQLModel | Built — deterministic booking engine, 14 passing tests, not yet exposed to the frontend or an agent |
| Database | SQLite | Built |
| Vector store | Qdrant (amenity policy/guideline retrieval) | Specified, not yet implemented |
| LLM | Gemini API | Specified, not yet implemented |
| Voice | Local speech-to-text (faster-whisper) + browser text-to-speech | Specified, not yet implemented |

No auth, no multi-agent framework, no LangChain — deliberately, see `AGENTS.md`.

## Core architectural principle

AmenityOS deliberately separates three kinds of truth:

| Truth | Source |
|---|---|
| Current availability, bookings, credits, eligibility, capacity | Transactional backend / database |
| Amenity policies and unstructured guidelines | RAG / vector retrieval |
| Natural-language interpretation and orchestration | LLM |

The LLM is not the source of truth and never directly modifies application state.

## Agent mental model

**Brain:** LLM + system prompt + current context

**Memory:** session history + relevant user context

**Knowledge:** RAG over amenity policies/guidelines

**Hands:** typed backend tools

**World / source of truth:** transactional database

**Voice:** speech-to-text + text-to-speech

**Physical access:** signed/opaque access token + QR + access verification service

## Repository structure

```
amenityos/
  README.md                  this file
  AGENTS.md                  engineering contract for AI coding agents working on this repo
  PROGRESS.md                one-line-per-change log of what's been built and why
  docs/                       full specification (see Documentation map below)
    archive/                  superseded early drafts, kept for reference only
  frontend/                  Next.js app (built, deployed, mock data)
  backend/                   FastAPI + SQLModel deterministic booking engine (built, tested)
  AmenityOS prototype shell-handoff.zip   original Claude Design handoff
  handoff-extracted/         unpacked copy of the design handoff, for reference
```

## Running it

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

Then open `http://localhost:3000`.

**Backend:**

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m app.seed        # demo users, amenities, bookings
uvicorn app.main:app --reload
```

API docs at `http://localhost:8000/docs`. Run `python -m pytest -v` for the
14-test suite. See `backend/README.md` for what's deliberately simplified
and where it diverges from `docs/14-api-contracts.md`.

**Agent, voice, RAG:** not yet implemented. `docs/16-developer-runbook.md` specifies the intended local setup (Qdrant, Gemini key, ingest scripts) for when that work lands — treat it as a target, not a current instruction.

## MVP capabilities

1. Natural-language amenity discovery
2. Free amenity booking
3. Paid amenity booking using credits
4. Explicit confirmation for paid bookings
5. Live availability checks
6. Alternative time/amenity suggestions from real availability
7. Eligibility validation
8. Capacity validation
9. Booking limits and working-hours validation
10. QR access pass generation
11. Simulated IoT access verification
12. Policy retrieval with RAG
13. Voice input using local speech-to-text
14. Browser text-to-speech for responses
15. Agent traces and evaluation

## Non-goals for MVP

- Real enterprise SSO
- Real payment gateway
- Real building access hardware
- Multi-agent orchestration
- Production-grade notification infrastructure
- Mobile native applications
- Autonomous outbound actions
- Unbounded web search
- Fully realtime speech-to-speech

## Documentation map

- `AGENTS.md` — instructions for AI coding agents working on this repository
- `docs/01-product-overview.md` — product scope and user journeys
- `docs/02-agent-role.md` — agent identity, responsibility, limits
- `docs/03-system-prompt.md` — canonical runtime system prompt
- `docs/04-agent-architecture.md` — end-to-end architecture
- `docs/05-tool-contracts.md` — tool definitions and contracts
- `docs/06-memory-context.md` — memory and context strategy
- `docs/07-rag.md` — embeddings, chunking, retrieval and policy handling
- `docs/08-voice-pipeline.md` — STT, VAD and TTS design
- `docs/09-booking-lifecycle.md` — booking state machine and transaction logic
- `docs/10-safety-guardrails.md` — security, authorization and anti-hallucination controls
- `docs/11-evaluation.md` — test suite and quality metrics
- `docs/12-observability.md` — traces, logs and operational metrics
- `docs/13-model-cost-latency.md` — model strategy and optimization
- `docs/14-api-contracts.md` — backend API contract
- `docs/15-data-model.md` — database entities and relationships
- `docs/16-developer-runbook.md` — local development and demo workflow
- `docs/17-failure-modes.md` — expected failures and recovery behavior
- `docs/18-roadmap.md` — post-MVP evolution

## Status

The frontend (all 8 screens above) is built and independently deployed against mock data. The backend's deterministic booking engine is built and tested (validation pipeline, atomic paid bookings, idempotency) but not yet wired to the frontend or to an LLM. Agent orchestration, RAG, and voice are fully specified in `docs/` but not yet implemented — that implementation should follow the contracts in this documentation rather than inventing new behavior.

## Design rule

When there is a conflict between conversational convenience and booking correctness, **booking correctness wins**.
