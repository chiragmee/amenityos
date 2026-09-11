from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ToolCallOut(BaseModel):
    tool_name: str
    duration_ms: int
    result_status: str
    error_code: Optional[str] = None
    booking_id: Optional[str] = None
    available: Optional[bool] = None
    alternatives_offered: Optional[int] = None


class TraceSummaryOut(BaseModel):
    id: str
    session_id: str
    user_id: str
    timestamp: datetime
    user_message: str
    final_response: str
    success: bool
    error_code: Optional[str] = None
    total_latency_ms: int
    tool_call_count: int


class TraceDetailOut(TraceSummaryOut):
    model: str
    input_tokens: int
    output_tokens: int
    tool_calls: list[ToolCallOut]
    retrieval_query: Optional[str] = None
    retrieved_chunk_ids: Optional[list[str]] = None


class MetricsOut(BaseModel):
    # Business metrics (docs/12) — bookings are cross-referenced from
    # AgentTrace's create_booking tool calls, so these describe bookings
    # made *through the agent*, not the manual booking form.
    total_requests: int
    agent_bookings_created: int
    paid_agent_bookings: int
    free_agent_bookings: int
    average_booking_completion_ms: Optional[float] = None
    unavailable_slot_count: int
    alternative_recommendation_rate: Optional[float] = None

    # AI metrics
    average_tool_calls_per_request: float
    average_input_tokens: float
    average_output_tokens: float
    retrieval_count: int
    average_retrieval_latency_ms: Optional[float] = None
    p50_latency_ms: Optional[float] = None
    p95_latency_ms: Optional[float] = None
    error_rate: float
