"""Lazy singleton Gemini client, shared by the chat agent (app/agent/) and
the RAG embedding pipeline (app/rag/) — both need the same client, just
for different API surfaces (generate_content vs. embed_content)."""

import os

from google import genai

_client: genai.Client | None = None


def get_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set")
        _client = genai.Client(api_key=api_key)
    return _client
