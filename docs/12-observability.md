# 12 — Observability

## Why observability matters

An agent can fail in ways traditional CRUD applications do not:
- wrong tool
- wrong parameters
- unnecessary tool loops
- irrelevant retrieval
- confusing model response
- successful backend action with incorrect wording

Therefore each interaction needs a trace.

## Agent trace

Record:

```text
trace_id
session_id
user_id
timestamp
user_message
transcript
model
input_tokens
output_tokens
tool_calls
tool_latencies
retrieval_query
retrieved_chunk_ids
final_response
success
error_code
total_latency_ms
```

## Tool trace

For each tool call:

```text
tool_name
start_time
duration_ms
input_schema_valid
result_status
error_code
```

Do not record secrets.

## Business metrics

Track:
- requests
- successful bookings
- failed bookings
- cancellation rate
- paid bookings
- free bookings
- average booking completion time
- alternative recommendation rate

## AI metrics

Track:
- average LLM calls/request
- average input tokens
- average output tokens
- tool calls/request
- retrieval count
- retrieval latency
- P50/P95 total latency

## Agent trace UI

For internal developers, show:

User request

Final outcome

Tools called

Tool execution status

Retrieved policy references

Latency

Token usage

Do not show chain-of-thought.

## Error taxonomy

Use stable error codes such as:

```text
AMENITY_NOT_FOUND
USER_NOT_ELIGIBLE
CAPACITY_EXCEEDED
OUTSIDE_WORKING_HOURS
DURATION_NOT_ALLOWED
SLOT_UNAVAILABLE
INSUFFICIENT_CREDITS
CONFIRMATION_REQUIRED
BOOKING_CONFLICT
TRANSACTION_FAILED
ACCESS_DENIED
TOKEN_EXPIRED
```
