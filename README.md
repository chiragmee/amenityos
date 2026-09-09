# AmenityOS

## AI-Powered Workplace Amenity Booking Agent

AmenityOS is an action-taking AI agent for workplace and commercial-real-estate amenity booking.

Instead of navigating a multi-step booking application, an employee can say or type:

> "Book Emerald Meeting Room today at 3 PM for five people."

The agent interprets the request, identifies the amenity, checks relevant rules, checks live availability, validates eligibility and capacity, handles credits for paid amenities, creates the booking when authorized, generates an access credential/QR code, and reports the actual result.

## Product thesis

The problem is not that employees cannot book amenities. The problem is that the booking workflow forces users to translate a simple intent into a sequence of UI interactions.

AmenityOS changes the interaction model from:

**Navigate → search → select → fill → validate → confirm → book**

to:

**Tell the system what you want → the agent performs the workflow.**

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

The frontend is independently deployed. Backend/agent components should be implemented against the contracts in this documentation rather than inventing new behavior during implementation.

## Design rule

When there is a conflict between conversational convenience and booking correctness, **booking correctness wins**.
