"""Lazy singleton Gemini client, shared by the chat agent (app/agent/), the
RAG embedding pipeline (app/rag/), and voice transcription (app/voice/) —
all need the same client, just for different API surfaces.

The SDK's default retry policy (5 attempts, exponential backoff up to 60s)
is tuned for offline/background jobs, not a synchronous user-facing
request — a transient 503 could make a single call block for the better
part of a minute before the exception ever reaches this app's own retry
logic (orchestrator._send_with_retry, voice's own retry), compounding
into multi-minute worst cases. Confirmed empirically (2026-09-12): a real
"high demand" 503 on gemini-flash-lite-latest made a transcription
request hang ~57s before failing, entirely inside the SDK's internal
retry loop. Capped here to 1 fast retry — the application-level retry
loops are where real backoff/logging/degradation decisions belong.

`timeout` is a real, server-enforced per-call deadline (confirmed: Gemini
rejects anything below 10000ms with "Manually set deadline Xs is too
short. Minimum allowed deadline is 10s" — 10s is the API's own floor, not
an arbitrary choice). Still not enough on its own: even at 20000ms, a
genuinely overloaded model returned its own `504 DEADLINE_EXCEEDED` after
~41s in production — i.e. Google's backend can still exceed the deadline
you asked for before honoring it. Set to the API's minimum (10000ms) so a
stuck first attempt fails and this app's own retry kicks in roughly twice
as fast as it did at 20000ms.

`retry_options.attempts` was left at 2 in an earlier pass and turned out
to still be the same compounding-retry bug this docstring already
describes, just one layer further down: the SDK's own retry sits
*underneath* this app's own retry loops (orchestrator._send_with_retry,
voice/recognizer.py's loop), so a single transient error could pay for
up to 2 full ~10s SDK attempts *per app-level attempt* — confirmed in
production logs (2026-09-12) as chained `httpx.ReadTimeout`s inside the
SDK's own tenacity retry, producing 24-52s single-turn chat latency and
40s+ voice-transcription hangs even though each individual layer looked
reasonable in isolation. Set to 1 (no SDK-level retry) so there is
exactly one retry decision-maker per call site, matching this file's own
stated principle below."""

import os

from google import genai
from google.genai import types

_client: genai.Client | None = None

REQUEST_TIMEOUT_MS = 10000  # Gemini's own enforced floor — see docstring


def get_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set")
        _client = genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(
                timeout=REQUEST_TIMEOUT_MS,
                retry_options=types.HttpRetryOptions(attempts=1, initial_delay=0.5, max_delay=2.0),
            ),
        )
    return _client
