"""Gemini embeddings for the RAG pipeline (docs/07-rag.md).

Model choice verified empirically against the live API (2026-09-12):
`text-embedding-004` and `gemini-embedding-latest` both 404 for this key;
`gemini-embedding-001` works. Uses asymmetric task types (RETRIEVAL_DOCUMENT
for ingested chunks, RETRIEVAL_QUERY for user questions) per Gemini's
retrieval guidance, and a reduced 768-dim output (the model supports
Matryoshka truncation) to keep the vector store small for this corpus size.
"""

from google.genai import types

from ..gemini_client import get_client

EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIM = 768


def embed_documents(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    client = get_client()
    response = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=texts,
        config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT", output_dimensionality=EMBEDDING_DIM),
    )
    return [e.values for e in response.embeddings]


def embed_query(text: str) -> list[float]:
    client = get_client()
    response = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
        config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY", output_dimensionality=EMBEDDING_DIM),
    )
    return response.embeddings[0].values
