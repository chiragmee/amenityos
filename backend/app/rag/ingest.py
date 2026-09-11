"""Builds the Qdrant collection from AmenityGuideline rows at app startup
(see main.py's lifespan). Metadata schema per docs/07-rag.md."""

from qdrant_client.models import PointStruct
from sqlmodel import Session, select

from ..models import Amenity, AmenityGuideline
from .chunking import chunk_text
from .embeddings import embed_documents
from .store import COLLECTION_NAME, get_store


def ingest_guidelines(session: Session) -> int:
    """Re-embeds and re-upserts every guideline. Returns the number of
    chunks indexed. Cheap to call on every startup at this corpus size."""
    guidelines = session.exec(select(AmenityGuideline)).all()
    amenity_names = {a.id: a.name for a in session.exec(select(Amenity)).all()}

    chunks: list[str] = []
    payloads: list[dict] = []
    for guideline in guidelines:
        for i, chunk in enumerate(chunk_text(guideline.content)):
            chunks.append(chunk)
            payloads.append(
                {
                    "amenity_id": guideline.amenity_id,
                    "amenity_name": amenity_names.get(guideline.amenity_id, guideline.amenity_id),
                    "document_name": guideline.document_name,
                    "chunk_id": f"{guideline.document_name}-{i:02d}",
                    "text": chunk,
                }
            )

    store = get_store()
    if not chunks:
        return 0

    vectors = embed_documents(chunks)
    points = [
        PointStruct(id=i, vector=vector, payload=payload)
        for i, (vector, payload) in enumerate(zip(vectors, payloads))
    ]
    store.upsert(collection_name=COLLECTION_NAME, points=points)
    return len(points)
