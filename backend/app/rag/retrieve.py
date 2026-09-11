"""Retrieval pipeline per docs/07-rag.md: embed the query, prefer exact
amenity filtering when the amenity is known, return top-k chunks."""

from qdrant_client.models import FieldCondition, Filter, MatchValue

from .embeddings import embed_query
from .store import COLLECTION_NAME, get_store

TOP_K = 3


def retrieve(query: str, amenity_id: str | None = None, top_k: int = TOP_K) -> list[dict]:
    store = get_store()
    query_filter = (
        Filter(must=[FieldCondition(key="amenity_id", match=MatchValue(value=amenity_id))])
        if amenity_id
        else None
    )
    vector = embed_query(query)
    results = store.query_points(
        collection_name=COLLECTION_NAME,
        query=vector,
        query_filter=query_filter,
        limit=top_k,
    )
    return [
        {
            "text": p.payload["text"],
            "amenity_id": p.payload["amenity_id"],
            "amenity_name": p.payload["amenity_name"],
            "document_name": p.payload["document_name"],
            "chunk_id": p.payload["chunk_id"],
            "score": p.score,
        }
        for p in results.points
    ]
