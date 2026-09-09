# 17 — Failure Modes

## Amenity not found

User:
> Book the Emerald room.

If no amenity matches confidently:

Ask a clarification or offer real matching options.

Do not invent an amenity.

## Multiple amenities match

Example:
Two buildings contain an Emerald Meeting Room.

Ask for the building unless the current context resolves it.

## Missing time

User:
> Book Emerald tomorrow.

Ask:
> What time would you like to book it?

Do not guess.

## Missing duration

Use configured default duration only when the amenity has an explicit default.

Otherwise ask.

## Unavailable slot

Return actual alternatives.

Never invent availability.

## Capacity exceeded

Reject the requested room.

Offer real larger amenities where available.

## User not eligible

State that the booking cannot be completed because the user is not eligible.

Do not reveal internal authorization implementation.

## Insufficient credits

State:
- required credits
- current balance
- booking cannot be completed

Do not create the booking.

## Paid booking without confirmation

Do not create.

## Booking transaction failure

Return:
> I couldn't complete the booking because the booking service failed. The booking was not confirmed.

Never say "done."

## Model/tool disagreement

When model assumptions conflict with tool results, trust the tool result.

## Duplicate request

Return existing booking using idempotency semantics where applicable.

## Qdrant unavailable

If the user asks a policy question and policy retrieval is unavailable:

> I can't verify that amenity policy right now.

Do not invent an answer.

Transactional booking may still proceed if all required deterministic booking checks are available.

## STT failure

Ask the user to try again.

## TTS failure

Keep displaying the text response.

## LLM failure

Return a safe retry message.

Do not execute speculative actions outside the agent loop.

## Access token expired

Return:
`TOKEN_EXPIRED`

Do not grant access.

## General principle

When uncertain:

**fail closed for actions; remain helpful for explanations.**
