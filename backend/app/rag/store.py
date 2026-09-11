"""Embedded (in-process) Qdrant, not a hosted cluster. The guideline
corpus is a handful of short per-amenity documents — small enough to
rebuild in memory on every app startup (same pattern as init_db()), so
this avoids provisioning a separate vector DB service for Phase B."""

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

from .embeddings import EMBEDDING_DIM

COLLECTION_NAME = "amenity_guidelines"

_client: QdrantClient | None = None


def get_store() -> QdrantClient:
    global _client
    if _client is None:
        _client = QdrantClient(":memory:")
        _client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=EMBEDDING_DIM, distance=Distance.COSINE),
        )
    return _client
