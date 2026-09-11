from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from ..admin.metrics import compute_metrics
from ..admin.schemas import MetricsOut, TraceDetailOut, TraceSummaryOut
from ..database import get_session
from ..errors import AppError, ErrorCode
from ..models import AgentTrace
from ..rag.ingest import ingest_guidelines

router = APIRouter(prefix="/admin")


@router.get("/traces", response_model=list[TraceSummaryOut])
def list_traces(limit: int = 50, session_id: str | None = None, session: Session = Depends(get_session)):
    query = select(AgentTrace)
    if session_id:
        query = query.where(AgentTrace.session_id == session_id)
    traces = session.exec(query.order_by(AgentTrace.timestamp.desc()).limit(min(limit, 200))).all()
    return [
        TraceSummaryOut(
            id=t.id,
            session_id=t.session_id,
            user_id=t.user_id,
            timestamp=t.timestamp,
            user_message=t.user_message,
            final_response=t.final_response,
            success=t.success,
            error_code=t.error_code,
            total_latency_ms=t.total_latency_ms,
            tool_call_count=len(t.tool_calls),
        )
        for t in traces
    ]


@router.get("/traces/{trace_id}", response_model=TraceDetailOut)
def get_trace(trace_id: str, session: Session = Depends(get_session)):
    trace = session.get(AgentTrace, trace_id)
    if trace is None:
        raise AppError(ErrorCode.INVALID_REQUEST, f"No trace with id '{trace_id}'.")
    return TraceDetailOut(
        id=trace.id,
        session_id=trace.session_id,
        user_id=trace.user_id,
        timestamp=trace.timestamp,
        user_message=trace.user_message,
        final_response=trace.final_response,
        success=trace.success,
        error_code=trace.error_code,
        total_latency_ms=trace.total_latency_ms,
        tool_call_count=len(trace.tool_calls),
        model=trace.model,
        input_tokens=trace.input_tokens,
        output_tokens=trace.output_tokens,
        tool_calls=trace.tool_calls,
        retrieval_query=trace.retrieval_query,
        retrieved_chunk_ids=trace.retrieved_chunk_ids,
    )


@router.get("/metrics", response_model=MetricsOut)
def get_metrics(session: Session = Depends(get_session)):
    return compute_metrics(session)


@router.post("/reingest-guidelines")
def reingest_guidelines(session: Session = Depends(get_session)):
    """Re-embeds and re-upserts every AmenityGuideline row into the RAG
    index. Lets guideline edits (or eval fixtures) take effect without a
    full app restart — see rag/ingest.py's docstring for why a full
    startup re-embed is cheap enough at this corpus size."""
    count = ingest_guidelines(session)
    return {"chunks_indexed": count}
