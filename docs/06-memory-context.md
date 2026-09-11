# 06 — Memory and Context Strategy

Nookly uses different memory mechanisms for different problems.

## 1. Session memory

Purpose:
Maintain the current conversation.

Example:

User:
> Book Emerald.

Agent:
> What time?

User:
> 3 PM.

The agent needs to retain that "3 PM" belongs to the Emerald booking.

Store:
- session ID
- messages
- structured state when useful
- timestamps

Do not endlessly send the entire historical conversation to the model.

## 2. User context

Examples:
- user ID
- company
- building
- eligibility
- current credits

Retrieve from the backend when needed.

Do not duplicate mutable user state inside model memory.

## 3. Preference memory

Future phase.

Examples:
- preferred building
- preferred meeting room
- typical duration

Preference memory should influence ranking, not override current availability or rules.

## 4. Knowledge memory

Amenity guidelines are stored as documents and retrieved using RAG.

They are not conversational memory.

## Context assembly

A typical request should contain:

```text
system prompt
+
relevant session state
+
minimal user context
+
relevant RAG chunks, if needed
+
tool results
```

## Context minimization rules

Do:
- retrieve only relevant policy chunks
- pass concise tool results
- keep only recent/relevant messages
- remove redundant fields

Do not:
- send the entire amenities database
- send all bookings
- send all policy documents
- send historical conversations indefinitely

## Structured state

For complex interactions, maintain explicit booking state:

```json
{
  "intent": "book_amenity",
  "amenity_id": "amenity_emerald",
  "date": "2026-09-09",
  "start_time": "15:00",
  "duration_minutes": 60,
  "attendee_count": 5,
  "payment_status": "not_required",
  "confirmation_status": "not_required"
}
```

The structured state is more reliable than expecting the LLM to reconstruct every parameter from raw conversation history.

## Context security

Never place:
- API keys
- database passwords
- internal secrets
- unrelated users' data
into the model context.
