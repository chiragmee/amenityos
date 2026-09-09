# 13 — Model, Cost and Latency Strategy

## MVP model strategy

Use a low-latency, tool-capable general model for the main agent.

Initial candidate:
**Gemini 2.5 Flash**, configured through the official Gemini API/SDK.

Model choice is a benchmark decision, not a permanent architecture decision.

The system should isolate the model behind a provider interface where practical.

## Model responsibilities

Use the model for:
- interpreting user language
- extracting intent/parameters
- choosing tools
- coordinating multiple tool calls
- composing responses

Do not use the model for:
- availability calculations
- credit arithmetic
- authorization
- booking conflict detection
- transactional writes

## Cost drivers

Primary drivers:
- input tokens
- output tokens
- number of LLM calls
- speech API usage if a cloud provider is introduced
- embedding calls
- unnecessary context

## Token optimization

1. Keep system prompt concise.
2. Keep tool descriptions concise.
3. Return compact tool results.
4. Retrieve only relevant policy chunks.
5. Keep only necessary conversation history.
6. Avoid repeating database fields.
7. Avoid unnecessary LLM calls.

## Latency budget

Track:

```text
STT
+
LLM call(s)
+
tool calls
+
retrieval
+
TTS
```

The first target should be measured P95 rather than assumed.

## Routing strategy — future

A future optimization may use:
- smaller model for intent/parameter extraction
- stronger model only for ambiguous or complex cases

Do not add model routing until baseline quality is measured.

## Model evaluation

Whenever changing models, compare:
- task success
- tool selection
- argument validity
- policy accuracy
- false success rate
- latency
- token consumption

A cheaper model that increases unsafe failures is not a successful optimization.
