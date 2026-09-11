import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session

from .database import engine, init_db
from .errors import AppError, app_error_handler
from .rag.ingest import ingest_guidelines
from .routers import access, admin, agent, amenities, availability, bookings, health, users, voice
from .voice.recognizer import get_recognizer

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    try:
        with Session(engine) as session:
            count = ingest_guidelines(session)
        logger.info("RAG: indexed %d guideline chunks", count)
    except Exception:
        # Policy Q&A degrades (get_amenity_policy returns no chunks) but
        # the rest of the app must still boot — see docs/17-failure-modes.md.
        logger.exception("RAG: guideline ingestion failed at startup")
    try:
        get_recognizer().warm_up()
        logger.info("Voice: STT recognizer ready")
    except Exception:
        # Voice input degrades (transcription fails per-request) but the
        # rest of the app must still boot.
        logger.exception("Voice: STT recognizer warm-up failed at startup")
    yield


app = FastAPI(title="Nookly API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(AppError, app_error_handler)

app.include_router(health.router)
app.include_router(users.router)
app.include_router(amenities.router)
app.include_router(availability.router)
app.include_router(bookings.router)
app.include_router(access.router)
app.include_router(agent.router)
app.include_router(voice.router)
app.include_router(admin.router)
