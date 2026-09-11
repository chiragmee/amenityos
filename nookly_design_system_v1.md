# Nookly — Product Design System v1.0

> **A soft architectural system for a workplace amenity-booking product.**
>
> Core idea: **space × moment × access**.
>
> Nookly should feel like a beautifully designed building directory that happens to be digital — warm, spatial, effortless, and quietly intelligent.

---

## 1. Brand Foundation

### Brand idea

Nookly helps people find the right place at the right moment without making them think about the booking mechanics.

### Brand personality

- **Warm** — approachable rather than corporate
- **Spatial** — designed around rooms, floors, places
- **Effortless** — the system handles complexity
- **Quietly intelligent** — helpful without feeling robotic
- **Reliable** — booking should feel dependable

### Avoid

Clinical, futuristic, hyper-minimal, luxury-hotel, generic SaaS, or visibly "AI-looking" design.

### Core principle

> **Don't design Nookly like booking software. Design it like a place finder.**

---

# 2. Colour

## Primary brand colours

| Token | Hex | Primary use |
|---|---|---|
| `Graphite 900` | `#22262B` | Primary text, navigation, primary controls |
| `Signage White` | `#F2F3F1` | Main light background |
| `Amber 500` | `#E8A33D` | Booking moments, active states, emphasis |

## UI neutrals

| Token | Hex | Use |
|---|---|---|
| `Graphite 800` | `#30353A` | Dark surfaces |
| `Graphite 600` | `#626970` | Secondary text |
| `Graphite 400` | `#9EA4A8` | Placeholder / disabled |
| `Stone 200` | `#D9DCDA` | Default borders |
| `Stone 100` | `#E8EAE7` | Dividers / subtle surfaces |
| `Stone 50` | `#F8F8F6` | Soft card surfaces |
| `White` | `#FFFFFF` | Elevated surfaces |

## Semantic tokens

```css
:root {
  --color-bg: #F2F3F1;
  --color-surface: #FFFFFF;
  --color-surface-subtle: #F8F8F6;

  --color-text-primary: #22262B;
  --color-text-secondary: #626970;
  --color-text-disabled: #9EA4A8;

  --color-border: #D9DCDA;
  --color-border-subtle: #E8EAE7;

  --color-brand: #22262B;
  --color-accent: #E8A33D;
}
```

## Amber rule

Amber means:

> **This matters right now.**

Use it for:
- selected time slot
- available booking moment
- current step
- voice/listening state
- important confirmation
- a small highlight in an illustration

Do **not** use amber as a general page background or for large areas.

Amber must remain meaningful.

---

# 3. Typography

## Primary product typeface

**Inter**

Use a neutral grotesque/sans-serif interface typeface. The Nookly wordmark remains its own brand asset.

## Type scale

| Style | Size | Line height | Weight |
|---|---:|---:|---:|
| Display | 48px | 52px | 600 |
| H1 | 36px | 42px | 600 |
| H2 | 28px | 34px | 600 |
| H3 | 22px | 28px | 600 |
| Title | 18px | 24px | 600 |
| Body | 16px | 24px | 400 |
| Body Small | 14px | 20px | 400 |
| Caption | 12px | 16px | 500 |

### Typography rules

Use **sentence case** throughout the product.

Prefer:

> Book a quiet room

Avoid:

> BOOK A QUIET ROOM

Use uppercase sparingly for tiny metadata labels only.

### Tracking

- Wordmark: **-2%**
- Product UI: **0%**
- Small uppercase labels: approximately **+4–6%**

---

# 4. Shape Language

Nookly is a "nook", so the interface should feel contained, welcoming, and gently architectural.

## Radius scale

```text
XS       6px
SM       10px
MD       16px
LG       24px
XL       32px
Pill     999px
```

Recommended defaults:

- Buttons: `12px`
- Cards: `16px`
- Feature surfaces: `24px`
- Chips / tags: `999px`

Avoid overly sharp containers.

---

# 5. Nook Geometry

Create a recurring visual motif inspired by the logo: a soft, three-sided enclosure that suggests a room, doorway, or protected corner.

Use this geometry subtly in:

- empty states
- room illustrations
- booking cards
- map markers
- onboarding
- confirmation states
- loading states

The geometry should be **simplified and abstract**, not a literal building blueprint.

> **Architectural abstraction > realistic floor plan.**

---

# 6. Spacing

Use an 8px base grid.

```text
4px    micro
8px    xs
12px   sm
16px   md
24px   lg
32px   xl
48px   2xl
64px   3xl
96px   4xl
```

Most application UI should live between **16px and 32px** spacing.

Give content room to breathe.

---

# 7. Buttons

## Primary

Graphite background, signage-white text.

```text
Book room
```

- Height: `48px`
- Radius: `12px`
- Strong contrast
- Sentence case

## Secondary

White/surface background with graphite border.

```text
View details
```

## Accent usage

Reserve amber for small emphasis rather than turning the whole interface amber.

Examples:

```text
● Available
```

or

```text
Selected
```

with an amber indicator.

## Voice action

Avoid a giant microphone button.

Prefer a calm intent-led control:

```text
┌────────────────────────────┐
│ Tell Nookly what you need  │
└────────────────────────────┘
```

The voice capability should be experienced through interaction rather than represented by an obvious microphone icon.

---

# 8. Cards

Nookly cards should represent **spaces**, not generic data containers.

Example:

```text
Quiet Room 04

4 people
2nd floor

Today
11:30 – 12:30

                    Available
```

Hierarchy:

1. Room name
2. Attributes
3. Time
4. Availability state

Recommended padding: `20–24px`.

Room imagery, when used, should use approximately `16px` radius.

---

# 9. Booking States

Booking state is a core part of the visual language.

### Available

Neutral surface + amber indicator.

### Selected

Soft warm-tinted surface + amber time marker.

### Booked by you

Graphite surface + white text + amber marker.

### Booked by someone else

Lower contrast / reduced emphasis.

### Unavailable

Stone surface and disabled styling.

### Current moment

Use a thin amber line or small amber marker.

### Accessibility rule

Colour must never be the only way the state is communicated. Pair colour with text, shape, or iconography.

---

# 10. Timeline

The timeline should become one of Nookly's signature components.

Avoid making it look like a standard calendar.

Example:

```text
10:00  ─────────────────────────

11:00  ────────████████─────────
                  Your booking

12:00  ─────────────────────────
```

A booking should visually **occupy a block of time**.

This directly expresses the product story:

> **A space + a moment = your nook.**

Treat the timeline more like an architectural schedule or floor directory than a calendar page.

---

# 11. Floor-Plan UI

Represent rooms as simplified geometric spaces.

Example:

```text
┌─────────────┬─────────────┐
│ Room 01     │ Room 02     │
│             │             │
├─────────────┼──────┬──────┤
│ Room 03     │ Nook │ 04   │
│             │      │      │
└─────────────┴──────┴──────┘
```

States:

- Available → neutral
- Selected → amber marker
- Your booking → graphite + amber
- Unavailable → muted

Do not make the map overly realistic.

---

# 12. Navigation

## Desktop

```text
Nookly

Today
Find a space
My bookings
Spaces
Building

────────────

Profile
```

## Mobile

```text
Home    Find    Bookings    Me
```

Keep navigation light. Nookly should remain **typographic and spatial**, not icon-heavy.

---

# 13. Iconography

Use a geometric line icon system.

Recommended:

- Stroke: `1.75–2px`
- Rounded terminals
- Simple construction
- Minimal detail

Useful icon categories:

- room
- desk
- people
- floor
- access
- time
- location
- availability
- arrow
- check

Avoid:

- microphone icons as the main brand/voice cue
- chat bubbles
- generic AI sparkles
- calendar-page icons
- overly detailed building illustrations

---

# 14. Voice Interaction

Voice should feel like a concierge, not a chatbot.

## Example

User:

> "I need a quiet room for four at 3."

Nookly:

```text
Got it.

Quiet room
4 people
Today · 3:00 PM
Floor 2

2 spaces match

[See spaces]
```

Then:

```text
Nookly found a good fit.

Room 204
3:00–4:00 PM

[Book it]
```

The system should interpret intent and surface a useful answer with as little ceremony as possible.

---

# 15. Confirmation

Confirmation should be calm and human.

Instead of:

> Booking successful!

Use:

```text
You're booked.

Room 204
2nd floor

Today
3:00–4:00 PM
```

Suggested motion:

**selected amber block → expands → forms a nook-like shape → settles**

This gives the visual metaphor a satisfying payoff:

> **space found → moment reserved → nook created**

---

# 16. Motion

Motion should feel **soft, physical, and purposeful**.

## Timing

```text
Micro        120ms
Standard     180ms
Emphasis     260ms
Transition   360ms
```

Use gentle ease-out curves.

Avoid exaggerated spring effects and flashy animation.

### Signature motion

The Nookly signature can be an amber time marker that expands into the shape of a reserved nook.

---

# 17. Shadows & Elevation

Prefer surface contrast and borders over heavy shadows.

Suggested floating shadow:

```css
box-shadow: 0 2px 8px rgba(34, 38, 43, 0.06);
```

Use shadows only when something needs to feel elevated or floating.

No dramatic shadows.

No gradients.

No 3D effects.

---

# 18. Photography & Illustration

## Photography

Prefer:

- real workplace environments
- naturally lit rooms
- quiet corners
- meeting spaces
- lounges
- architectural details
- materials and textures

Avoid:

- staged corporate stock photos
- handshakes
- generic laptop shots
- futuristic office imagery
- overly luxurious commercial interiors

The story is about **finding a good place**, not selling office real estate.

## Illustration

Use simple architectural linework and soft geometric forms.

Illustrations should feel:
- human
- calm
- spatial
- understated

---

# 19. Empty States

Empty states should retain Nookly's personality.

Instead of:

> No results found.

Use:

> **No quiet spaces right now.**  
> Try another time or floor.

Or:

> **Looks like this nook is taken.**  
> Here are three nearby options.

Keep the copy helpful rather than overly playful.

---

# 20. Voice & Copy

Nookly should sound like a helpful workplace concierge.

### Good

> I found two rooms nearby.

> Room 204 is free at 3 PM.

> You're booked.

> Want something quieter?

### Avoid

> Your request has been successfully processed.

> Please select an available amenity.

> No matching resources were found.

---

# 21. Responsive Philosophy

## Desktop

Emphasize:

**floor plan + timeline + details**

## Tablet

Prioritize:

**space + time**

## Mobile

Prioritize:

**intent + answer**

Example mobile home:

```text
Good afternoon.

What do you need?

[ Find me a room ]

[ Find a desk ]

[ My bookings ]
```

The interface should feel like a helpful starting point rather than a dense dashboard.

---

# 22. Accessibility

Target **WCAG 2.2 AA**.

Requirements:

- Amber is never the only status indicator
- Minimum interactive target: `44 × 44px`
- Primary body text: `16px`
- Maintain strong text/background contrast
- Provide visible focus states
- Support keyboard navigation
- Use semantic labels for room availability and booking status

---

# 23. Design Tokens — Starter CSS

```css
:root {
  /* Colour */
  --color-bg: #F2F3F1;
  --color-surface: #FFFFFF;
  --color-surface-subtle: #F8F8F6;

  --color-text-primary: #22262B;
  --color-text-secondary: #626970;
  --color-text-disabled: #9EA4A8;

  --color-border: #D9DCDA;
  --color-border-subtle: #E8EAE7;

  --color-brand: #22262B;
  --color-accent: #E8A33D;

  /* Radius */
  --radius-xs: 6px;
  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-xl: 32px;
  --radius-pill: 999px;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
  --space-9: 96px;

  /* Typography */
  --font-family:
    "Inter",
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;

  --text-sm: 14px;
  --text-md: 16px;
  --text-lg: 18px;
  --text-xl: 22px;
  --text-2xl: 28px;
  --text-3xl: 36px;
  --text-4xl: 48px;

  /* Elevation */
  --shadow-float:
    0 2px 8px rgba(34, 38, 43, 0.06);
}
```

---

# 24. Product UI Principles

### 01 — Space first

When deciding between a generic UI pattern and a spatial representation, prefer the spatial representation.

### 02 — Make the moment visible

Bookings should look like **something occupying time**, not just a row of metadata.

### 03 — Warmth through restraint

Warmth should come from colour, spacing, copy, geometry, and motion — not decorative elements.

### 04 — Hide the machinery

Users should not need to understand the booking engine, availability logic, or AI orchestration.

### 05 — Amber has meaning

Use the accent sparingly enough that users learn:

> **Amber = this is my moment.**

### 06 — Never look like generic AI

Nookly can be AI-powered without visually announcing "AI".

---

# 25. Signature Brand Pattern

A useful mental model for every future component:

```text
SPACE
  ↓
MOMENT
  ↓
ACCESS
  ↓
NOOK
```

Every major interaction should reinforce at least one of these concepts.

Examples:

- Floor plan → **space**
- Timeline → **moment**
- Door/access state → **access**
- Completed booking → **nook**

---

# 26. Brand Expression

### Primary brand statement

**Nookly**

### Recommended descriptor

**Your workplace, booked.**

### Brand thought

> **Good spaces make great days.**

### Product philosophy

> **Find the right place. At the right moment. Without the hassle.**

---

# 27. Non-negotiables

Nookly's visual identity should consistently follow these rules:

1. **No gradients**
2. **No 3D**
3. **No heavy shadows**
4. **No generic AI sparkle language**
5. **No microphone-first branding**
6. **No calendar-page visual language**
7. **No excessive use of amber**
8. **No all-caps product UI**
9. **Use rounded geometry**
10. **Keep the experience spatial, calm, and human**

---

## Final Design Direction

**Nookly = soft architecture + time + warmth.**

The logo creates the visual metaphor.

The floor plan represents **space**.

The timeline represents **moment**.

The amber marker represents **your booking**.

The voice experience represents **effortless access**.

The result should feel less like enterprise facilities software and more like **a calm digital layer over the physical workplace.**
