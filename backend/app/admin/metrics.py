"""Business + AI metrics rollup per docs/12-observability.md, computed
directly from AgentTrace (this is the only source of truth for what the
agent actually did — nothing here is estimated or fabricated)."""

from sqlmodel import Session, select

from ..models import AgentSession, AgentTrace, CreditLedger, TransactionType
from .schemas import MetricsOut


def _percentile(sorted_values: list[float], pct: float) -> float | None:
    if not sorted_values:
        return None
    idx = min(len(sorted_values) - 1, int(len(sorted_values) * pct))
    return sorted_values[idx]


def compute_metrics(session: Session) -> MetricsOut:
    traces = session.exec(select(AgentTrace)).all()
    total_requests = len(traces)

    session_started_at = {
        s.id: s.created_at for s in session.exec(select(AgentSession)).all()
    }

    agent_booking_ids: list[str] = []
    completion_times_ms: list[float] = []
    unavailable_count = 0
    unavailable_with_alternatives = 0
    retrieval_latencies: list[float] = []
    tool_call_counts: list[int] = []
    input_tokens: list[int] = []
    output_tokens: list[int] = []
    total_latencies: list[float] = []
    error_count = 0

    for trace in traces:
        tool_call_counts.append(len(trace.tool_calls))
        input_tokens.append(trace.input_tokens)
        output_tokens.append(trace.output_tokens)
        total_latencies.append(trace.total_latency_ms)
        if not trace.success:
            error_count += 1

        for call in trace.tool_calls:
            if call["tool_name"] == "get_amenity_policy":
                retrieval_latencies.append(call["duration_ms"])
            if call["tool_name"] == "check_availability" and call.get("available") is False:
                unavailable_count += 1
                if (call.get("alternatives_offered") or 0) > 0:
                    unavailable_with_alternatives += 1
            if call["tool_name"] == "create_booking" and call.get("booking_id"):
                agent_booking_ids.append(call["booking_id"])
                started_at = session_started_at.get(trace.session_id)
                if started_at is not None:
                    completion_times_ms.append((trace.timestamp - started_at).total_seconds() * 1000)

    paid_agent_bookings = 0
    if agent_booking_ids:
        debits = session.exec(
            select(CreditLedger.booking_id).where(
                CreditLedger.booking_id.in_(agent_booking_ids),
                CreditLedger.transaction_type == TransactionType.debit,
            )
        ).all()
        paid_agent_bookings = len(set(debits))

    sorted_latencies = sorted(total_latencies)

    return MetricsOut(
        total_requests=total_requests,
        agent_bookings_created=len(agent_booking_ids),
        paid_agent_bookings=paid_agent_bookings,
        free_agent_bookings=len(agent_booking_ids) - paid_agent_bookings,
        average_booking_completion_ms=(
            sum(completion_times_ms) / len(completion_times_ms) if completion_times_ms else None
        ),
        unavailable_slot_count=unavailable_count,
        alternative_recommendation_rate=(
            unavailable_with_alternatives / unavailable_count if unavailable_count else None
        ),
        average_tool_calls_per_request=(
            sum(tool_call_counts) / total_requests if total_requests else 0.0
        ),
        average_input_tokens=sum(input_tokens) / total_requests if total_requests else 0.0,
        average_output_tokens=sum(output_tokens) / total_requests if total_requests else 0.0,
        retrieval_count=len(retrieval_latencies),
        average_retrieval_latency_ms=(
            sum(retrieval_latencies) / len(retrieval_latencies) if retrieval_latencies else None
        ),
        p50_latency_ms=_percentile(sorted_latencies, 0.50),
        p95_latency_ms=_percentile(sorted_latencies, 0.95),
        error_rate=error_count / total_requests if total_requests else 0.0,
    )
