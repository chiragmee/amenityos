# Nookly — Product Spec

Source of truth for this spec: the Claude Design handoff `AmenityOS.dc.html`
(extracted to `handoff-extracted/`). This document describes the product as
that prototype defines it — screens, flows, and states — independent of
implementation technology.

## What Nookly is

A workplace amenity-booking product for a single tenant/org ("Google",
"Tower A" in the mock data). Employees book meeting rooms, gym slots,
theater, table tennis, etc. either by **voice/natural language** or by
browsing a catalog. Bookings that cost credits draw from a monthly
per-employee credit allowance. Booking issues an **access pass** (QR code)
redeemable at the amenity entrance. Admins configure amenities (schedule,
capacity, pricing, eligibility, plain-language guidelines) that the booking
assistant enforces.

The core product bet: booking should feel like asking a person, not filling
a form. The assistant resolves a request against live availability, rules,
eligibility, and credits, and either books it, offers valid alternatives, or
explains why it can't.

## Users

- **Employee** — books amenities, views bookings/credits/pass, has no admin
  access. All 8 screens except the edit half of Admin are employee-facing.
- **Workplace admin** — configures amenities (the Admin screen). In the
  prototype this is not gated by auth (see Out of scope); "Priya N." appears
  as a named admin in mock copy (last-edited-by, credit top-up approver).

## Screens

1. **Home** (`/`) — voice/text booking hero + upcoming bookings.
2. **AI Assistant** (`/assistant`) — canned-scenario demo of the assistant's
   reasoning: unavailable slot, paid amenity, insufficient credits, capacity
   exceeded.
3. **Amenities** (`/amenities`) — browsable catalog, grid of cards.
4. **My Bookings** (`/bookings`) — table of all bookings, upcoming + past.
5. **Credits** (`/credits`) — balance, allowance, spend, activity ledger.
6. **Admin** (`/admin`) — amenity list + per-amenity configuration form.
7. **Access Pass** (`/pass`) — QR code + booking details, active/expired.
8. **Profile** (`/profile`) — identity, credit summary, eligibility, voice
   preference.

Every screen has a **mobile layout** (bottom tab bar: Home / Amenities /
Bookings / Profile) in addition to the desktop layout (left sidebar). In the
prototype these are toggled by a demo-only "Desktop/Mobile" switch in the
header; in the real product this becomes ordinary responsive design — the
switch itself is not a product feature and should not be built.

## Core flow: voice/text booking

1. User holds the mic button (or types a request and hits Send/Enter).
2. **Listening** — waveform animates while recording.
3. **Processing** — a 4-step checklist plays sequentially: understanding
   the request → checking availability → checking booking rules → booking.
   Each step shows todo → active (spinner) → done (check) in order.
4. **Done** — confirmation summary (amenity, time, attendees, cost) plus a
   QR access pass appears. User can view the full pass, add to calendar,
   cancel, or ask again.

This same 4-step shape reappears conceptually in the AI Assistant screen's
scenarios (there, shown as a chat transcript rather than a live timer).

## Core flow: assistant reasoning (non-happy-path)

The Assistant screen demonstrates four cases the booking pipeline must
handle, each selectable via a chip:

- **Slot unavailable** — requested time is taken; assistant offers valid
  alternative times/rooms; user picks one; booking confirms.
- **Paid amenity** — booking has a credit cost; assistant states the cost
  and remaining balance and asks for explicit confirmation before charging.
- **Insufficient credits** — user can't afford it; booking is blocked;
  user can request a credit top-up from an admin instead.
- **Capacity exceeded** — requested room is too small for the attendee
  count; assistant offers larger rooms that fit; user picks one; booking
  confirms.

Every assistant response ends with a monospace **trace line** summarizing
what was checked (e.g. "availability checked · 3 conflicting holds · 0
credits required") — this is a transparency/debugging affordance the real
agent must be able to produce for every resolution.

## Core flow: admin configuration

Admin sees a table of all configured amenities (type, capacity, rules,
active/inactive). "Configure" opens an edit form grouped into Identity,
Location, Schedule, and Rules & Pricing, plus a free-text **guidelines**
box ("Maximum booking duration: 2 hours / Maximum attendees: 8 / …") that
the assistant is described as reading directly when resolving requests, and
which is shown parsed into a rule count ("6 rules parsed · 0 conflicts").
Saving shows a transient confirmation banner. "New amenity" opens the same
form empty.

## Explicitly out of scope (per instruction)

- Authentication of any kind — no login, no session, no role gate. Admin
  screen is reachable by anyone for now.
- Multi-tenant support — single org, single building in mock data.
- A multi-agent framework, or LangChain, absent a compelling reason.
- Backend implementation — this pass is frontend-only, against mock data.
- Real calendar integration, real QR validation, real payment/credit
  settlement — these are stubbed/faked until backend work begins.

## Success criteria for this pass

- All 8 screens render and are navigable (desktop sidebar + responsive
  mobile tab bar).
- Voice flow, assistant scenarios, admin list↔edit toggle, and pass
  active↔expired all work end-to-end against mock data, matching the
  interaction states defined in `frontend-spec.md`.
- Visual output matches `AmenityOS.dc.html` (colors, type, spacing,
  animations) closely enough to be recognizably the same design.
