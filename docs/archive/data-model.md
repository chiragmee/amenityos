# Nookly — Data Model

Entities implied by the design handoff, shaped for SQLite (relational core)
+ Qdrant (semantic amenity search) below. TypeScript mirrors for the
frontend mock layer live in `frontend/lib/types.ts` and should stay in
sync with this document by hand (no codegen in this pass).

## Conventions

- IDs: booking IDs follow the prototype's visible format `AMN-#####`
  (5-digit). Internal primary keys are plain integers/UUIDs; `AMN-#####`
  is a display code derived from the booking id, not the PK itself.
- Money/credits: integers (credits), no fractional credits.
- Times: ISO 8601 strings over the wire; the prototype only ever shows
  same-day/relative-day human strings ("Today", "Tomorrow", "Friday") —
  the frontend derives those from real timestamps once backed by a real
  API; mock data can hardcode the display strings for now.

## Entities

### User

```
id            string (uuid)
name          string                 e.g. "Chirag"
org           string                 e.g. "Google"      (workplace plan grantor)
building      string                 e.g. "Tower A"
role          "employee" | "admin"
avatarInitial string                 single letter, derived from name if absent
credits       int                    current balance
monthlyAllowance int                 e.g. 40
eligibility   string                 display string, e.g. "All amenities" (MVP: no real ACL)
voiceEnabled  boolean
```

No auth in this pass — a single hardcoded `User` is the "current user."
`role` exists so the data model doesn't need to change when auth lands.

### Amenity

```
id            string
name          string                 e.g. "Emerald Meeting Room"
type          "Meeting room" | "Conference room" | "Fitness" | "Theater" | "Recreation"
building      string
floor         string
lat, lng      float                  optional, admin-entered
capacity      int
costCredits   int                    0 = free
active        boolean

// schedule
workingHours       string            "08:00–20:00"
availableDays       "Monday–Friday" | "All days" | "Weekends only"
minDurationMins     int
maxDurationMins     int
defaultDurationMins int
allowedDurations    int[]            minutes, e.g. [30,60,90,120]
advanceBookingDays  int

// rules & pricing
maxActiveBookingsPerUser int
bookingFrequency         string      e.g. "2 per day"
eligibilityRule          string      "All employees" | "Managers and above" | "Named list"
cancellationPolicy       string

// content
description   string
guidelines    string                 free-text, plain-language rules the
                                      agent reads at resolution time (see
                                      agent-spec.md)
photoRef      string | null          placeholder in mock data

lastEditedAt  datetime | null
lastEditedBy  string | null          e.g. "Priya N."
```

`guidelines` is the field the Admin screen's "6 rules parsed · 0
conflicts" indicator summarizes — see `agent-spec.md` for how that parse
step works once it's real.

### AvailabilitySlot (derived, not stored)

Computed from `Amenity` schedule fields + existing `Booking`s for a given
day; not a persisted table. Shape returned by the availability tool:

```
amenityId     string
start, end    datetime
free          boolean
```

### Booking

```
id            string (uuid, PK)
displayId     string                 "AMN-20481" (derived/generated)
userId        string
amenityId     string
start, end    datetime
attendees     int
costCredits   int                    snapshot at booking time
status        "confirmed" | "completed" | "cancelled"
createdVia    "voice" | "text" | "manual"
createdAt     datetime
accessPass    AccessPass
```

### AccessPass

```
bookingId     string
qrPayload     string                 opaque token encoded into the QR
validFrom, validUntil  datetime
status        "active" | "expired"
```

Real QR payload should be a signed/opaque token the entrance scanner (not
built in this phase) can validate against `bookingId` + validity window —
not the booking id in plaintext.

### CreditLedgerEntry

```
id            string
userId        string
bookingId     string | null          null for allowance grants
description   string                 e.g. "Gym · Tomorrow 6:00 PM"
amount        int                    signed; negative = spend, positive = grant
occurredAt    datetime
```

Balance = sum of a user's ledger entries. `monthlyAllowance` grants are
themselves ledger entries (`+40` on reset day), so balance and history
never disagree.

### AssistantTurn (for the Assistant screen / agent transcript, not booking history)

```
id            string
scenario      string                 free label, only meaningful pre-agent
userUtterance string
agentText     string
options       AssistantOption[]      alternatives offered, if any
actions       AssistantAction[]      buttons offered, if any
resultTitle, resultBody   string | null
blockTitle, blockBody     string | null
trace         string                 monospace debug summary
createdAt     datetime
```

```
AssistantOption { name, detail, tag, resultingBookingDraft }
AssistantAction { label, kind: "primary" | "secondary", effect }
```

This entity models the *display* of one resolved request. The underlying
reasoning trace (tool calls, checks performed) is a superset covered by
`agent-spec.md`; `trace` here is the human-readable summary line shown in
the UI.

## Relationships

```
User 1—* Booking
User 1—* CreditLedgerEntry
Amenity 1—* Booking
Booking 1—1 AccessPass
Booking 0..1—* CreditLedgerEntry   (a costed booking produces one spend entry)
```

## Vector store (Qdrant) — what gets embedded

Not a source-of-truth store; a search index over `Amenity` rows, rebuilt
on amenity create/update:

```
collection: amenities
point id:    amenity.id
vector:      embedding of "{name} — {type}. {description}. {guidelines}"
payload:     { amenityId, name, type, building, floor, capacity,
               costCredits, active }
```

Used for natural-language amenity matching ("book a quiet room for 8
people", "somewhere I can stretch before lunch") where the request doesn't
name an amenity directly — see `agent-spec.md` / `tool-spec.md` for how
this is called.

## SQLite schema notes

- One file DB for MVP, no multi-tenancy.
- Tables: `users`, `amenities`, `bookings`, `access_passes`,
  `credit_ledger`. `access_passes` could be columns on `bookings` instead
  of a separate table — kept separate here because pass state (active/
  expired) and QR payload are conceptually distinct from booking state
  and may get their own lifecycle (e.g. re-issue) later.
- No migrations framework specified yet — decide at backend implementation
  time (Alembic is the obvious default with FastAPI+SQLite, but that's a
  backend-spec decision, not a data-model one).
