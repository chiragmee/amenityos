# Nookly — Frontend Spec

Reproduces `AmenityOS.dc.html` in Next.js (App Router) + TypeScript +
Tailwind, against mock data. No auth. No state library — local React state
is sufficient given the scope.

## Stack

- Next.js 14+, App Router, TypeScript, client components (this app is
  almost entirely interactive/stateful — no meaningful server-rendering
  win at this stage).
- Tailwind CSS, theme extended with the prototype's exact tokens (below).
  No component library (shadcn/etc.) — hand-rolled primitives keep the
  dependency surface matching "don't add unnecessary dependencies."
- No global state manager. Per-page `useState`/`useReducer`. Shared user
  identity/credits state lifted only as far as needed (see State ownership).
- No animation library — the prototype uses 5 plain CSS `@keyframes`
  (`wf`, `pulseRing`, `rise`, `spin`, `pop`); reproduce as global CSS.
- No QR library — the prototype generates a fake QR-looking SVG from a
  seeded PRNG (`qrUri()`); port that function verbatim so pass/booking
  visuals match until a backend issues real QR payloads.

## Design tokens

```
Background:      #f4f4f1 (app bg), #fbfbf9 (sidebar/mobile chrome)
Surface:         #ffffff (cards)
Border:          #e4e4de (default), #eeeee9 / #f2f2ed (hairline), #e7e7e1 (rule)
Text:            #1b1b19 (primary), #4a4a44 / #3f3f3a (secondary),
                  #6f6f68 / #5f5f58 (muted), #8a8a82 / #9a9a92 (faint)
Accent (green):  #0f5c52 (primary), #0b463e (hover/dark), #cfe3df (border-tint),
                  #f2f7f5 / #f5faf8 (bg-tint)
Danger (red):    #9c4a44 (text), #8f3f39 (dark text), #f0dede (border-tint),
                  #fdf5f4 / #fdf7f6 (bg-tint), #6f4f4c (body text on red)
Dark (buttons):  #1b1b19 bg / #ffffff text, hover → accent green
Fonts:            'Instrument Sans' (400/500/600) — body/UI
                  'IBM Plex Mono' (400/500) — labels, badges, monospace data
Radii:            6–8px controls, 10–14px cards, 99px pills/avatars
```

Load both fonts via `next/font/google` (Instrument_Sans, IBM_Plex_Mono),
not the prototype's `<link>` tags.

## Animations (global CSS, verbatim from prototype)

```css
@keyframes wf        { 0%,100% { transform: scaleY(.25) } 50% { transform: scaleY(1) } }
@keyframes pulseRing { 0% { transform: scale(1); opacity:.5 } 100% { transform: scale(1.45); opacity:0 } }
@keyframes rise       { from { opacity:0; transform: translateY(6px) } to { opacity:1; transform: none } }
@keyframes spin       { to { transform: rotate(360deg) } }
@keyframes pop        { 0% { transform: scale(.85); opacity:0 } 60% { transform: scale(1.04) } 100% { transform: scale(1); opacity:1 } }
```

## App shell

- **Sidebar** (desktop, ≥ md breakpoint): logo mark ("A" on green square +
  "Nookly" wordmark), nav list, spacer, user footer (avatar initial,
  name, workspace, "Profile" button). Nav items: Home, AI Assistant,
  Amenities, My Bookings, — divider —, Credits, — divider —, Admin. Active
  item: light-grey pill bg + green dot + dark text. Inactive: transparent,
  grey dot, hover bg.
- **Header** (sticky, blurred bg): uppercase monospace breadcrumb (route
  label; `/pass` shows "My Bookings / Access pass"), spacer, credit pill
  (green dot + "N credits"). The prototype's Desktop/Mobile switch here is
  a **design-tool-only affordance** — omit it; real responsiveness handles
  this via CSS breakpoints.
- **Mobile** (< md breakpoint): no sidebar; bottom tab bar with 4 tabs
  (Home, Amenities, Bookings, Profile) — Credits, Admin, Assistant, and
  Pass are desktop-only surfaces reachable via links from Home/Bookings,
  matching the prototype's mobile subset (`mHome`/`mAmenities`/
  `mBookings`/`mProfile`).

## Pages, components, and state

### 1. Home (`/`)

**Components:** `VoicePanel` (idle/listening/processing/done sub-states),
`Waveform` (24 animated bars desktop / 16 mobile, heights from a
deterministic pseudo-random generator seeded per-bar, staggered
animation-delay), `StepChecklist` (4 steps: "Understanding request…",
"Checking <amenity> availability…", "Checking booking rules…", "Booking
<amenity>…"), `TypedRequestBar` (text input + Send, Enter submits),
`BookingConfirmCard` (status badge, booking id, amenity name/location,
When/Attendees/Cost grid, QR image, action buttons: View booking / Add to
calendar / Cancel booking), `UpcomingBookingCard` (grid, 3 shown, "View
all" link to `/bookings`).

**Interaction states** (`voice: idle | listening | processing | done`):
- `idle`: pulsing-ring mic button, label "Hold to speak" (desktop) / hold
  interaction is a press-and-hold in the prototype; for the web app, use
  click-to-start / click-to-stop or click-to-simulate (see Voice spec
  below) since there's no real mic yet.
- `listening`: waveform replaces button, label "Listening…", monospace
  "release to send" caption (desktop only).
- `processing`: transcript quote appears, 4-step checklist advances one
  step at a time on a timer (620ms cadence in prototype — configurable).
- `done`: checklist fully checked, green check + "Your booking is
  confirmed." + "Ask again" button; `BookingConfirmCard` and QR appear
  below with `pop`/`rise` animations.

"Ask again" resets to `idle` and clears the typed input.

Amenity "Book" buttons elsewhere (Amenities page) navigate Home and
pre-fill the typed field with `Book {amenity} today at 3 PM for {min(5,cap)}
people` — do not auto-submit.

### 2. AI Assistant (`/assistant`)

**Components:** `ScenarioChips` (4 pills: Slot unavailable / Paid amenity /
Insufficient credits / Capacity exceeded — selected = filled green),
`ChatTranscript` (user bubble right-aligned dark; agent turn left-aligned
with "A" avatar mark), `OptionsList` (bordered panel, header label, rows
with name/detail/tag + "Book this" button), `ActionRow` (primary green
button(s) + secondary outline button(s)), `ResultPanel` (green-tinted,
check icon + title + body), `BlockPanel` (red-tinted, title + body),
`TraceLine` (monospace footer).

Each scenario is its own tiny state machine, reset when the chip changes:

- **unavailable**: shows 3 alternative slots → picking one sets `booked`
  → agent text changes to confirmation + `ResultPanel` with booking id
  `AMN-20482`.
- **paid**: `ask` state shows cost + balance + Confirm/Cancel actions →
  Confirm deducts 10 credits from shared credit state and shows
  `ResultPanel` (`AMN-20483`); Cancel shows a plain "nothing booked" agent
  line, no panels.
- **low**: shows `BlockPanel` (insufficient credits) + "Contact admin"
  primary action → clicking shows `ResultPanel` ("Request sent to
  workplace admin. Priya N. will review…"), no booking is created.
- **capacity**: 2 room options (one tagged "TOO SMALL BY 2", one "FITS 8")
  → picking either sets `booked` → `ResultPanel` (`AMN-20484`).

The `paid` scenario is the only one that touches shared credit state —
confirming there deducts 10 credits, and that deduction should be visible
on `/credits` and in the header pill (shared state, see State ownership).

### 3. Amenities (`/amenities`)

**Components:** `AmenityCard` — placeholder photo block (diagonal-stripe
pattern, matching prototype's CSS `repeating-linear-gradient`, no real
images) with shot-label + availability badge overlay, name, price/credit
badge, location, capacity, full-width "Book" button (→ Home, pre-filled,
per above).

Grid: `repeat(auto-fill, minmax(292px,1fr))` desktop; stacked column
mobile.

### 4. My Bookings (`/bookings`)

**Components:** `BookingTable` — header row (AMENITY / WHEN / COST /
STATUS), rows for all bookings (upcoming: CONFIRMED, green; past:
COMPLETED grey or CANCELLED red), each row has a "Pass" button → `/pass`.
Mobile: stacked `BookingListItem` cards instead of a table.

### 5. Credits (`/credits`)

**Components:** 3 stat tiles (Remaining — big number + progress bar;
Monthly allowance — static 40; Spent this month — derived as
`40 - remaining`), `LedgerList` (rows: description, date, signed amount
colored green/red).

Remaining credits, progress bar %, and spent must all derive from the same
shared credit value used on Home/header/Profile/Assistant-paid-scenario —
single source of truth (see State ownership).

### 6. Admin (`/admin`)

**List view:** header + "New amenity" button, table (AMENITY / TYPE /
CAPACITY / RULES / STATUS), 7 rows from mock data, ACTIVE (green pill) /
INACTIVE (grey pill) badges, "Configure" button per row.

**Edit view:** "← All amenities" back link, title + subtitle (existing:
"{name} · last edited 4 days ago by Priya N."; new: "New amenity · not yet
published"), "Save amenity" (primary) + "Deactivate" (destructive outline,
no-op) buttons. Save shows a transient green confirmation banner
("Configuration saved…") for ~2.6s.

Form: 4 grouped sections (`FormGroup`) — IDENTITY (name, type select,
description), LOCATION (building select, floor, capacity, lat/long text),
SCHEDULE (working hours, available days select, min/max/default duration
selects, allowed-durations text, advance booking window select), RULES &
PRICING (max bookings/user, booking frequency select, Free/Paid select,
credit cost, eligibility select, cancellation policy select). All fields
pre-fill from the amenity being edited; "New amenity" fields start empty/
default. Right rail: sticky **Guidelines** card — free-text textarea
(11 rows, monospace) + static "6 rules parsed · 0 conflicts" indicator
(mock-only; real parsing is a backend/agent capability, see
`agent-spec.md`).

### 7. Access Pass (`/pass`)

**Components:** Active/Expired mode toggle (pill switch — this one *is* a
real product feature, unlike the desktop/mobile switch, since a pass
genuinely expires), status badge, QR image (large, 232px), countdown
("Valid for MM:SS", ticking down every second while active), details grid
(Amenity / Location / Valid / Attendees), action buttons (Back to
bookings, Add to calendar).

Expired state: grayscale + low-opacity QR, "This access pass is no longer
valid." message, no countdown.

### 8. Profile (`/profile`)

**Components:** avatar + name/workspace header, stat grid (Credits
remaining — shared value, Eligibility — static "All amenities", Voice —
static "Enabled").

## State ownership

To keep this frontend-only pass simple but not fake broken (e.g. crediting
must be consistent across screens), lift exactly this much state to a
single provider at the app root:

- `credits: number` (starting value from mock data; decremented by the
  Assistant "paid" scenario's Confirm action and by Home voice-flow
  bookings that cost credits, if a costed amenity is booked).
- `bookings: Booking[]` (mock list; voice-flow "done" and Assistant
  scenario confirmations append a new booking so `/bookings` and Home's
  "Upcoming bookings" reflect it).

Everything else (voice sub-state, scenario picks, admin list/edit toggle,
pass mode, typed input, mobile tab) is local to its page/component — the
prototype's flat `state` object doesn't imply a real app needs one global
store, and adding one here would be exactly the kind of unnecessary
complexity the task calls out to avoid.

Implement the shared slice with plain React Context + `useState` — no
external state library.

## Data the frontend expects from (future) backend

See `data-model.md` for full shape. Frontend-visible fields, summarized:
user identity/credits/eligibility; amenity catalog with availability text,
pricing, capacity, config fields; bookings with status/cost/QR; credit
ledger entries; assistant scenario responses (options, actions, result/
block text, trace string). All of it is served from `lib/mock-data.ts` in
this pass, typed to match the eventual API response shapes so swapping in
real fetches later is a data-layer change, not a component rewrite.

## Explicitly deferred

- Real microphone capture / real Whisper transcription — voice flow is
  fully simulated (canned transcript, timed step progression) until
  backend voice work lands.
- Device (Desktop/Mobile) switch — replaced by responsive CSS.
- Auth/login — no route guards anywhere, including `/admin`.
- Real QR payloads, real calendar export, real credit top-up email/
  notification — all stubbed.
