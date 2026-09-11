import logging

from fastapi import APIRouter, UploadFile

from ..errors import AppError, ErrorCode
from ..voice.recognizer import get_recognizer

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/voice/transcribe")
async def transcribe(audio: UploadFile) -> dict:
    try:
        text = get_recognizer().transcribe(audio.file)
    except Exception:
        logger.exception("Voice: transcription failed")
        raise AppError(ErrorCode.TRANSCRIPTION_FAILED, "I couldn't understand that. Please try again.")

    if not text:
        raise AppError(ErrorCode.TRANSCRIPTION_FAILED, "I couldn't understand that. Please try again.")

    return {"text": text}
