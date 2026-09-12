"""Speech-to-text per docs/08-voice-pipeline.md, kept behind a
SpeechRecognizer interface so the underlying provider can be swapped
without touching the router or the agent — docs/08 explicitly anticipated
this: "This allows a cloud STT provider to be introduced later."

Started with local faster-whisper (tiny/int8) per docs/08's MVP choice,
but measured ~30s per short clip on Render's free-tier CPU (0.1 vCPU) —
confirmed via two back-to-back live requests that both took ~30s and both
transcribed correctly (ruling out cold start and a functional bug; it was
just CPU-bound inference on a heavily throttled core, ~100x slower than
the same model on a real CPU). Switched to Gemini's audio understanding:
~1-3s per clip verified empirically, and more accurate on longer/harder
phrases in a head-to-head test (whisper-tiny badly mangled a 12-word test
phrase that Gemini got essentially right). Reuses the existing Gemini
client/key — no new credential needed.
"""

import logging
import time
from abc import ABC, abstractmethod
from typing import BinaryIO

import httpx
from google.genai import errors as genai_errors
from google.genai import types

from ..gemini_client import get_client

logger = logging.getLogger(__name__)

TRANSCRIPTION_MODEL = "gemini-flash-lite-latest"
NO_SPEECH_SENTINEL = "NO_SPEECH_DETECTED"
TRANSCRIPTION_PROMPT = (
    "Transcribe the exact spoken words in this audio clip verbatim. "
    f"If there is no intelligible speech, respond with exactly: {NO_SPEECH_SENTINEL}. "
    "Otherwise return ONLY the transcript text, nothing else."
)
MAX_TRANSCRIBE_RETRIES = 1
RETRY_BACKOFF_SECONDS = 1


class SpeechRecognizer(ABC):
    @abstractmethod
    def transcribe(self, audio: BinaryIO) -> str:
        """Returns the transcribed text, or an empty string if nothing
        intelligible was detected. Errors from genuine infrastructure/input
        failures (unreadable audio, etc.) propagate — the caller (routers/
        voice.py) translates those into TRANSCRIPTION_FAILED."""


class GeminiSpeechRecognizer(SpeechRecognizer):
    def warm_up(self) -> None:
        # No local model to load — this just fails fast at startup if
        # GEMINI_API_KEY is missing, rather than on the first real request.
        get_client()

    def transcribe(self, audio: BinaryIO) -> str:
        audio_bytes = audio.read()
        client = get_client()
        part = types.Part.from_bytes(data=audio_bytes, mime_type="audio/webm")

        last_error: Exception | None = None
        for attempt in range(MAX_TRANSCRIBE_RETRIES + 1):
            try:
                response = client.models.generate_content(
                    model=TRANSCRIPTION_MODEL,
                    contents=[TRANSCRIPTION_PROMPT, part],
                )
                text = (response.text or "").strip()
                return "" if text == NO_SPEECH_SENTINEL else text
            except (genai_errors.ServerError, genai_errors.ClientError, httpx.RequestError) as exc:
                last_error = exc
                logger.warning("Gemini transcription error on attempt %d: %s", attempt + 1, exc)
                if attempt < MAX_TRANSCRIBE_RETRIES:
                    time.sleep(RETRY_BACKOFF_SECONDS)
        raise last_error


_recognizer = GeminiSpeechRecognizer()


def get_recognizer() -> GeminiSpeechRecognizer:
    return _recognizer
