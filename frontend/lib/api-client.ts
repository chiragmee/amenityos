import type {
  BackendAccessVerify,
  BackendAgentChatResponse,
  BackendAmenity,
  BackendAmenityPolicy,
  BackendAmenityWrite,
  BackendAvailability,
  BackendBooking,
  BackendCancelResult,
  BackendCredits,
  BackendErrorBody,
  BackendMetrics,
  BackendTraceDetail,
  BackendTraceSummary,
  BackendUser,
  BackendValidateResult,
} from "./backend-types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/** No auth in this app yet — every request acts as this seeded demo user. */
export const CURRENT_USER_ID = "usr_chirag";

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(
      "NETWORK_ERROR",
      "Could not reach the backend. It may be waking up from idle (free-tier cold start can take up to a minute) — try again shortly.",
      0
    );
  }

  if (!response.ok) {
    let body: BackendErrorBody | null = null;
    try {
      body = await response.json();
    } catch {
      // non-JSON error body, fall through to generic message
    }
    throw new ApiError(
      body?.error?.code ?? "UNKNOWN_ERROR",
      body?.error?.message ?? `Request failed with status ${response.status}.`,
      response.status
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function getUser(userId: string) {
  return request<BackendUser>(`/users/${userId}`);
}

export function getAmenities() {
  return request<BackendAmenity[]>("/amenities");
}

export function getAmenity(amenityId: string) {
  return request<BackendAmenity>(`/amenities/${amenityId}`);
}

export function getAmenityPolicy(amenityId: string) {
  return request<BackendAmenityPolicy>(`/amenities/${amenityId}/policy`);
}

export function createAmenity(payload: BackendAmenityWrite) {
  return request<BackendAmenity>("/amenities", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAmenity(amenityId: string, payload: BackendAmenityWrite) {
  return request<BackendAmenity>(`/amenities/${amenityId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function checkAvailability(payload: {
  amenity_id: string;
  start_time: string;
  duration_minutes: number;
  attendee_count: number;
}) {
  return request<BackendAvailability>("/availability/check", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function validateBooking(payload: {
  user_id: string;
  amenity_id: string;
  start_time: string;
  duration_minutes: number;
  attendee_count: number;
}) {
  return request<BackendValidateResult>("/bookings/validate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createBooking(payload: {
  user_id: string;
  amenity_id: string;
  start_time: string;
  duration_minutes: number;
  attendee_count: number;
  attendee_ids?: string[];
  idempotency_key: string;
}) {
  return request<BackendBooking>("/bookings", {
    method: "POST",
    body: JSON.stringify({ attendee_ids: [], ...payload }),
  });
}

export function getBooking(bookingId: string) {
  return request<BackendBooking>(`/bookings/${bookingId}`);
}

export function cancelBooking(bookingId: string, userId: string) {
  return request<BackendCancelResult>(`/bookings/${bookingId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
}

export function getUserBookings(userId: string) {
  return request<BackendBooking[]>(`/users/${userId}/bookings`);
}

export function getUserCredits(userId: string) {
  return request<BackendCredits>(`/users/${userId}/credits`);
}

export function verifyAccess(token: string) {
  return request<BackendAccessVerify>("/access/verify", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function agentChat(payload: { session_id: string | null; user_id: string; message: string }) {
  return request<BackendAgentChatResponse>("/agent/chat", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getTraces(limit = 50) {
  return request<BackendTraceSummary[]>(`/admin/traces?limit=${limit}`);
}

export function getTrace(traceId: string) {
  return request<BackendTraceDetail>(`/admin/traces/${traceId}`);
}

export function getMetrics() {
  return request<BackendMetrics>("/admin/metrics");
}

export async function transcribeAudio(blob: Blob): Promise<string> {
  const form = new FormData();
  form.append("audio", blob, "recording.webm");

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/voice/transcribe`, { method: "POST", body: form });
  } catch {
    throw new ApiError("NETWORK_ERROR", "Could not reach the backend. Please try again.", 0);
  }

  if (!response.ok) {
    let body: BackendErrorBody | null = null;
    try {
      body = await response.json();
    } catch {
      // non-JSON error body, fall through to generic message
    }
    throw new ApiError(
      body?.error?.code ?? "UNKNOWN_ERROR",
      body?.error?.message ?? "I couldn't understand that. Please try again.",
      response.status
    );
  }

  const data = (await response.json()) as { text: string };
  return data.text;
}

export function newIdempotencyKey(): string {
  return `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
