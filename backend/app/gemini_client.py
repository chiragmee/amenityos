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
loops are where real backoff/logging/degradation decisions belong."""

import os

from google import genai
from google.genai import types

_client: genai.Client | None = None


def get_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set")
        _client = genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(
                timeout=20000,
                retry_options=types.HttpRetryOptions(attempts=2, initial_delay=0.5, max_delay=2.0),
            ),
        )
    return _client
