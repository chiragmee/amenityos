# 04 — Agent Architecture

## End-to-end architecture

```text
User
 |
 | voice or text
 v
Frontend
 |
 +--> Speech-to-text (voice path)
 |
 v
Agent API
 |
 v
LLM Orchestrator
 |
 +--------------------+
 |                    |
 v                    v
RAG retrieval        Typed tools
 |                    |
 v                    +--> user/profile
Policy context        +--> amenities
                      +--> eligibility
                      +--> availability
                      +--> cost
                      +--> booking
                      +--> access token
                              |
                              v
                       Transaction DB
                              |
                              v
                         QR access
                              |
                              v
                        IoT simulator
```

## Three-layer intelligence model

### Layer 1 — Language intelligence

Responsible for:
- intent detection
- entity extraction
- temporal understanding
- conversational state
- tool selection
- response generation

Technology:
LLM

### Layer 2 — Knowledge retrieval

Responsible for:
- amenity guidelines
- policy documents
- unstructured instructions
- contextual reference

Technology:
embeddings + vector database

### Layer 3 — Deterministic execution

Responsible for:
- validation
- availability
- authorization
- credits
- booking creation
- access verification

Technology:
typed backend services + relational database

## Agent loop

```text
User message
    |
    v
LLM
    |
    +-- final response --> user
    |
    +-- tool call
            |
            v
       tool execution
            |
            v
       tool result
            |
            v
           LLM
```

The loop continues until:
- the agent can answer safely, or
- a required clarification is needed, or
- the operation fails.

## Why one agent?

The MVP uses one orchestrator agent.

A multi-agent system would introduce:
- additional latency
- additional prompts
- more state passing
- more failure modes
- harder debugging

There is no demonstrated product requirement for multiple agents in the first version.

## Source-of-truth boundaries

| Information | Authoritative source |
|---|---|
| Amenity exists | DB |
| Capacity | DB |
| Current availability | DB/service |
| Current booking | DB |
| Credits | DB |
| Eligibility | DB/service |
| Guideline text | RAG corpus |
| User intent | LLM interpretation |
| Booking success | Booking service result |
| QR validity | Access verification service |

## Key design principle

**The model decides what to ask or do; deterministic services decide whether the action is allowed and execute it.**
