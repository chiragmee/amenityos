/** Mirrors backend/app/schemas.py exactly. Raw wire shapes — see lib/map-backend.ts
 * for how these become the UI-facing types in lib/types.ts. */

export interface BackendUser {
  id: string;
  name: string;
  email: string;
  company: string;
  building: string;
  floor: number;
  role: "employee" | "manager" | "admin" | "guest";
  is_active: boolean;
  credits: number;
}

export interface BackendAmenity {
  id: string;
  name: string;
  description: string;
  type: string;
  building: string;
  floor: number;
  capacity: number;
  default_duration_minutes: number;
  minimum_duration_minutes: number;
  maximum_duration_minutes: number;
  allowed_durations: number[];
  working_hours_start: string;
  working_hours_end: string;
  is_paid: boolean;
  credit_cost: number;
  max_bookings_per_user: number;
  advance_booking_hours: number;
  cancellation_window_minutes: number;
  is_active: boolean;
}

export interface BackendGuideline {
  document_name: string;
  document_version: string;
  content: string;
  effective_from: string | null;
  effective_to: string | null;
}

export interface BackendAmenityPolicy {
  amenity_id: string;
  guidelines: BackendGuideline[];
}

export interface BackendBooking {
  id: string;
  user_id: string;
  amenity_id: string;
  start_time: string;
  end_time: string;
  status: "confirmed" | "cancelled" | "completed";
  attendee_count: number;
  credits_deducted: number;
  access_token: string | null;
  created_at: string;
}

export interface BackendLedgerEntry {
  id: number;
  transaction_type: "debit" | "credit" | "refund";
  amount: number;
  balance_after: number;
  booking_id: string | null;
  created_at: string;
}

export interface BackendCredits {
  user_id: string;
  balance: number;
  ledger: BackendLedgerEntry[];
}

export interface BackendAvailability {
  available: boolean;
  conflicts: { start_time: string; end_time: string }[];
}

export interface BackendValidateResult {
  valid: boolean;
  error_code: string | null;
  message: string | null;
  is_paid: boolean;
  credit_cost: number;
  current_balance: number;
  sufficient_credits: boolean;
}

export interface BackendAccessVerify {
  allowed: boolean;
  booking_id?: string;
  amenity?: string;
  valid_until?: string;
  reason?: string;
}

export interface BackendErrorBody {
  error: { code: string; message: string };
}

export interface BackendAgentChatResponse {
  session_id: string;
  message: string;
  booking: { id: string; access_token: string | null } | null;
}

export interface BackendToolCall {
  tool_name: string;
  duration_ms: number;
  result_status: string;
  error_code: string | null;
  booking_id: string | null;
  available: boolean | null;
  alternatives_offered: number | null;
}

export interface BackendTraceSummary {
  id: string;
  session_id: string;
  user_id: string;
  timestamp: string;
  user_message: string;
  final_response: string;
  success: boolean;
  error_code: string | null;
  total_latency_ms: number;
  tool_call_count: number;
}

export interface BackendTraceDetail extends BackendTraceSummary {
  model: string;
  input_tokens: number;
  output_tokens: number;
  tool_calls: BackendToolCall[];
  retrieval_query: string | null;
  retrieved_chunk_ids: string[] | null;
}

export interface BackendMetrics {
  total_requests: number;
  agent_bookings_created: number;
  paid_agent_bookings: number;
  free_agent_bookings: number;
  average_booking_completion_ms: number | null;
  unavailable_slot_count: number;
  alternative_recommendation_rate: number | null;
  average_tool_calls_per_request: number;
  average_input_tokens: number;
  average_output_tokens: number;
  retrieval_count: number;
  average_retrieval_latency_ms: number | null;
  p50_latency_ms: number | null;
  p95_latency_ms: number | null;
  error_rate: number;
}
