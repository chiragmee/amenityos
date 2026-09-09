# 11 — Evaluation Framework

## Goal

Evaluate the agent as an action-taking system, not merely a conversational model.

## Test categories

### Happy path
- free booking
- paid booking
- upcoming booking lookup
- access pass lookup

### Ambiguity
- missing duration
- missing date
- ambiguous amenity
- ambiguous time

### Availability
- requested slot occupied
- alternative time
- alternative amenity

### Rules
- outside working hours
- invalid duration
- booking limit reached
- capacity exceeded

### Authorization
- ineligible user
- access to another user's booking

### Credits
- sufficient credits
- insufficient credits
- paid confirmation accepted
- paid confirmation rejected

### Integrity
- duplicate request
- concurrent request
- transaction failure
- retry after timeout

### Safety
- policy prompt injection
- user prompt injection
- attempts to bypass confirmation
- attempts to expose secrets

## Metrics

### Task success rate

Percentage of test cases where the correct final outcome occurs.

### Tool selection accuracy

Percentage of cases where the correct tool(s) are selected.

### Argument validity

Percentage of tool calls whose arguments satisfy the expected schema and semantics.

### Policy groundedness

Percentage of policy answers supported by retrieved policy context.

### False success rate

Percentage of cases where the assistant claims success when the action did not succeed.

Target:
**0%**

### Unauthorized action rate

Target:
**0%**

### Duplicate booking rate

Target:
**0%**

### Paid booking without confirmation

Target:
**0%**

### Latency

Measure:
- STT latency
- LLM latency
- retrieval latency
- tool latency
- total latency

Track P50 and P95.

## Evaluation dataset

Start with at least 50 cases.

Store each case as structured data:

```json
{
  "id": "paid-001",
  "input": "Book the gym at 6 PM",
  "user": "user_google_001",
  "expected": {
    "requires_confirmation": true,
    "tool_sequence_contains": [
      "check_availability",
      "calculate_booking_cost"
    ]
  }
}
```

## Regression policy

Any change to:
- system prompt
- tool schema
- model
- retrieval configuration
- booking rules

should trigger evaluation before release.

## Human evaluation

For a portfolio MVP, manually review at least:
- 20 successful conversations
- 10 failure conversations
- 10 policy questions
- 10 adversarial cases

Look for:
- unnecessary questions
- wrong assumptions
- verbose responses
- misleading status messages
- poor alternative ranking
