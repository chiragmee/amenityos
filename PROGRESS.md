# Progress Log

One line per change: what + why + files touched. Newest entries at the top.

---

**2026-09-11** — Wrote the Phase A agent implementation plan (no code yet — user asked to review the plan first). Covers: tool wrappers over the existing booking_engine.py (no new business logic, translation layer only), the orchestrator loop, POST /agent/chat, giving the already-built-but-unused AgentSession/AgentMessage tables a real purpose, and rewiring Home + Assistant to call it. Flagged three open decisions (Assistant page UI approach, clarifying-question UI slot, Gemini API key provisioning) for the user before starting.
Why: user asked "when and how" for the full voice agent integration; docs/02-08 already spec the architecture in detail, so this translates that into a concrete, sequenced build plan rather than re-deriving the design from scratch.
Files: `docs/19-agent-phase-a-implementation-plan.md` (new), `README.md`

**2026-09-11** — Fixed a real gap: there was no working manual booking flow. Amenities page's "Book" button redirected to Home and prefilled text, but Home's flow always creates the same hardcoded Emerald-at-3pm booking regardless — clicking "Book" on the Gym or any other amenity silently booked Emerald instead. Added a real `/amenities/[amenityId]` booking page: pick date/time/duration/attendees, live-validated against the real backend (debounced `POST /bookings/validate` as you type, showing real cost/availability/errors), submit via the existing `createRealBooking`. Removed the broken prefill mechanism entirely (`pendingPrefill` in app-state.tsx) now that nothing produces it correctly. Voice/text on Home stays as a convenience layer on top of this, not the only way to book.
Why: user caught that the core "browse and book manually" path — the actual product, with voice as a convenience on top — was never built; only the voice demo and its fixed scenario existed.
Files: `frontend/app/amenities/[amenityId]/page.tsx` (new), `frontend/components/amenities/{book-amenity-view,amenity-card}.tsx`, `frontend/lib/{types,map-backend,app-state}.tsx`, `frontend/app/page.tsx`, `README.md`

**2026-09-11** — Rebranded AmenityOS to Nookly per `nookly_design_system_v1.md` and the door-nook logo set: new graphite/stone/amber palette (old CSS tokens aliased onto it so components didn't need individual rewrites), Inter for UI text + Comfortaa for the wordmark, real logo (favicon, sidebar, mobile header). Redesigned Home's voice control — dropped the giant circular mic button for a calm text-input-first control per the spec's explicit "no microphone-first branding" rule. Converted all-caps status badges (Confirmed/Active/Inactive/Cancelled/Expired) to sentence case + a small colored dot, and fixed several primary buttons that had been amber-filled (should be graphite; amber is reserved for small emphasis only, e.g. the active nav dot or a confirmation checkmark). Case-sensitive renamed "AmenityOS" → "Nookly" across all docs and UI copy, careful not to touch real infra identifiers that still say "amenityos" (repo name, DB file, deployed URLs).
Why: user explicitly requested a rebrand under the new product name with a provided design system and logo assets.
Files: `frontend/app/{globals.css,layout.tsx,page.tsx,icon.svg,apple-icon.png}`, `frontend/public/brand/`, most of `frontend/components/*` and `frontend/app/*`, `README.md`, `AGENTS.md`, `docs/*.md`, `backend/README.md`, `backend/app/main.py`, `nookly_design_system_v1.md` + `nookly_final_logo_assets.zip` (added)

**2026-09-11** — Wired the frontend to the live backend, deleting mock-data.ts. Every page now reads real data; Home's voice flow and Assistant page actions create real bookings. Found and fixed a real bug during verification: the backend treats timestamps as naive wall-clock (no UTC math) but the frontend was sending true-UTC-converted times via `.toISOString()`, which would silently book the wrong hour for any non-UTC browser. Added `lib/backend-time.ts` to cross that boundary consistently; verified with a real booking + access-token-verify + capacity-exceeded-error round trip against the deployed backend.
Why: mock data was never going to prove the system works — needed the whole path (browser → Vercel → Render → Supabase) exercised for real.
Files: `frontend/lib/{api-client,backend-types,backend-time,format,map-backend}.ts` (new), `frontend/lib/{app-state,types,use-voice-flow,use-assistant-scenario}.ts`, most of `frontend/app/*` and several `frontend/components/*`, `frontend/lib/mock-data.ts` (deleted)

**2026-09-11** — Deployed the backend for real: Supabase Postgres (project `amenityos`, `us-east-1`) as the database, Render free-tier web service (`amenityos-backend.onrender.com`) running the FastAPI app, connected via the Supavisor connection pooler (the direct host is IPv6-only, which Render's free tier can't reach). Added `psycopg[binary]` as the Postgres driver.
Why: prove the backend runs somewhere other than localhost before wiring the frontend to it.
Files: `backend/requirements.txt`, `.gitignore` (Supabase CLI cache)

**2026-09-11** — Built the backend: FastAPI + SQLModel deterministic booking engine, 10 entities, 12 routes, seed data (3 users, 7 amenities), 14 passing tests. Updated `docs/14-api-contracts.md` and added `backend/README.md` to document where the build diverged from the original contract doc (no `/api` prefix, `POST /access/verify` instead of `GET .../verify/{token}`, two added endpoints). Updated root README's stack table, repo structure, and status to reflect it. No LLM/RAG/voice connected yet, per instruction — this proves the deterministic engine alone.
Why: prove the booking engine is correct before adding any agent/LLM layer on top of it.
Files: `backend/` (all), `docs/14-api-contracts.md`, `README.md`

**2026-09-11** — Built the backend: FastAPI + SQLModel deterministic booking engine, 10 entities, 12 routes, seed data (3 users, 7 amenities), 14 passing tests. Updated `docs/14-api-contracts.md` and added `backend/README.md` to document where the build diverged from the original contract doc (no `/api` prefix, `POST /access/verify` instead of `GET .../verify/{token}`, two added endpoints). Updated root README's stack table, repo structure, and status to reflect it. No LLM/RAG/voice connected yet, per instruction — this proves the deterministic engine alone.
Why: prove the booking engine is correct before adding any agent/LLM layer on top of it.
Files: `backend/` (all), `docs/14-api-contracts.md`, `README.md`

**2026-09-11** — Removed `AmenityOS.html` (unexplained, gitignored, unreferenced export) from the project folder.
Why: repo cleanup — requested, no longer useful.
Files: deleted `AmenityOS.html`; trimmed the now-stale `.gitignore` line for it

**2026-09-09** — Initialized progress log.
Why: tracking project state in files instead of conversation memory, per CLAUDE.md.
Files: `PROGRESS.md`

**2026-09-09** — Expanded README with product landscape, tech stack, repo structure, run instructions.
Why: the doc-derived README was too abstract for an outside visitor to know what the repo contains.
Files: `README.md`

**2026-09-09** — Replaced the six early draft specs with the full Nookly agent documentation set (`AGENTS.md` + `docs/00`–`18`); moved drafts to `docs/archive/`.
Why: the new set (from the Claude Design agent-docs export) is a complete, authoritative rewrite of the same ground the drafts covered.
Files: `AGENTS.md`, `docs/00-documentation-index.md`..`docs/18-roadmap.md`, `docs/archive/*`

**2026-09-09** — Pushed the repo to GitHub (`chiragmee/amenityos`, public) and deployed `frontend/` to Vercel production.
Why: get the frontend live and the repo shareable.
Files: `.gitignore`; Vercel project linked with root directory `frontend`, auto-deploy on push to `main`.

**2026-09-09** — Built the full frontend prototype (Next.js + TypeScript + Tailwind) against mock data: all 8 screens (Home/voice booking, AI Assistant, Amenities, My Bookings, Credits, Admin, Access Pass, Profile), responsive shell, shared credits/bookings state.
Why: reproduce the Claude Design handoff (`AmenityOS.dc.html`) as a real app before building the backend.
Files: `frontend/` (all)

**2026-09-09** — Wrote six initial spec docs (product/frontend/backend/agent/data-model/tool) from the design handoff.
Why: ground the frontend build and the eventual backend in a written spec before coding, per the three-gate workflow.
Files: now archived at `docs/archive/*`
