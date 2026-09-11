"""Semantic chunking per docs/07-rag.md's initial configuration:
~300-500 token chunks with ~50 token overlap. Token count is approximated
by whitespace-split word count — good enough for these initial, explicitly
non-final defaults (docs/07 calls them "testable defaults, not guaranteed
optimal values")."""

CHUNK_SIZE_TOKENS = 400
OVERLAP_TOKENS = 50


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE_TOKENS, overlap: int = OVERLAP_TOKENS) -> list[str]:
    words = text.split()
    if not words:
        return []
    if len(words) <= chunk_size:
        return [text.strip()]

    chunks = []
    step = chunk_size - overlap
    for start in range(0, len(words), step):
        chunk_words = words[start : start + chunk_size]
        if not chunk_words:
            break
        chunks.append(" ".join(chunk_words))
        if start + chunk_size >= len(words):
            break
    return chunks
