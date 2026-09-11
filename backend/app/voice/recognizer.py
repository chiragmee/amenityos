"""Speech-to-text per docs/08-voice-pipeline.md: MVP is local faster-whisper,
kept behind a `SpeechRecognizer` interface so a cloud provider can be
swapped in later without touching the router or the agent.

Model choice verified empirically (2026-09-12): faster-whisper's bundled
PyAV decodes webm/opus directly (the format browsers' MediaRecorder
actually produces) — no server-side ffmpeg conversion step needed. `tiny`
+ int8 on CPU transcribes a short clip in ~0.2-0.4s once loaded; the first
load per process downloads/initializes the model (~15s cold, <1s warm from
cache) — see main.py's lifespan, which warms this at startup so the first
real request doesn't pay that cost.
"""

import logging
from abc import ABC, abstractmethod
from typing import BinaryIO

logger = logging.getLogger(__name__)

MODEL_SIZE = "tiny"


class SpeechRecognizer(ABC):
    @abstractmethod
    def transcribe(self, audio: BinaryIO) -> str:
        """Returns the transcribed text, or an empty string if nothing
        intelligible was detected. Never raises for ordinary bad/silent
        audio — only for genuine infrastructure failure."""


class FasterWhisperRecognizer(SpeechRecognizer):
    def __init__(self) -> None:
        self._model = None

    def _ensure_loaded(self):
        if self._model is None:
            from faster_whisper import WhisperModel

            self._model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")
        return self._model

    def warm_up(self) -> None:
        self._ensure_loaded()

    def transcribe(self, audio: BinaryIO) -> str:
        model = self._ensure_loaded()
        segments, _info = model.transcribe(audio, beam_size=1)
        return " ".join(segment.text for segment in segments).strip()


_recognizer = FasterWhisperRecognizer()


def get_recognizer() -> FasterWhisperRecognizer:
    return _recognizer
