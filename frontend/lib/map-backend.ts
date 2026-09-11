import type {
  BackendAmenity,
  BackendBooking,
  BackendLedgerEntry,
  BackendUser,
} from "./backend-types";
import {
  formatAdvanceWindow,
  formatDurationsLabel,
  formatHoursLabel,
  formatLedgerDate,
  formatWhen,
} from "./format";
import type { Amenity, AmenityType, Booking, CreditLedgerEntry, User } from "./types";

const SHOT_LABEL_BY_TYPE: Record<string, string> = {
  "Meeting room": "room photo",
  "Conference room": "room photo",
  Fitness: "gym photo",
  Theater: "theater photo",
  Recreation: "lounge photo",
};

/**
 * Fields with no backend counterpart (booking frequency, eligibility-rule
 * summary, cancellation policy copy) get honest-but-generic placeholders —
 * the real constraints live in AmenityRule rows the amenities endpoint
 * doesn't expose yet, not in these display strings.
 */
export function mapAmenity(a: BackendAmenity): Amenity {
  return {
    id: a.id,
    name: a.name,
    type: a.type as AmenityType,
    building: a.building,
    floor: String(a.floor),
    capacity: a.capacity,
    costCredits: a.credit_cost,
    active: a.is_active,

    workingHours: formatHoursLabel(a.working_hours_start, a.working_hours_end),
    workingHoursStart: a.working_hours_start,
    workingHoursEnd: a.working_hours_end,
    availableDays: "See working hours",
    minDurationMins: a.minimum_duration_minutes,
    maxDurationMins: a.maximum_duration_minutes,
    defaultDurationMins: a.default_duration_minutes,
    allowedDurations: a.allowed_durations,
    allowedDurationsLabel: formatDurationsLabel(a.allowed_durations),
    advanceBookingHours: a.advance_booking_hours,
    advanceBookingDaysLabel: formatAdvanceWindow(a.advance_booking_hours),

    maxActiveBookingsPerUser: a.max_bookings_per_user,
    bookingFrequency: `${a.max_bookings_per_user} active at a time`,
    eligibilityRule: "Set via amenity rules",
    cancellationPolicy: `Free until ${a.cancellation_window_minutes} min before`,

    description: a.description,
    guidelines: "",
    shotLabel: SHOT_LABEL_BY_TYPE[a.type] ?? "photo",
    availabilityLabel: a.type,

    lastEditedAt: null,
    lastEditedBy: null,
  };
}

export function mapBooking(
  b: BackendBooking,
  amenitiesById: Map<string, BackendAmenity>
): Booking {
  const amenity = amenitiesById.get(b.amenity_id);
  const isPaid = amenity?.is_paid ?? b.credits_deducted > 0;
  return {
    id: b.id,
    displayId: b.id,
    amenityId: b.amenity_id,
    amenityName: amenity?.name ?? b.amenity_id,
    place: amenity ? `${amenity.building} · Floor ${amenity.floor}` : "",
    when: formatWhen(b.start_time, b.end_time),
    meta: isPaid ? `${b.credits_deducted} credits` : `${b.attendee_count} attendees`,
    attendees: b.attendee_count,
    costCredits: b.credits_deducted,
    status: b.status,
    createdVia: "voice",
    accessToken: b.access_token,
    startTime: b.start_time,
    endTime: b.end_time,
  };
}

export function mapLedgerEntry(
  l: BackendLedgerEntry,
  bookingsById: Map<string, BackendBooking>,
  amenitiesById: Map<string, BackendAmenity>
): CreditLedgerEntry {
  let name = "Adjustment";
  if (l.booking_id) {
    const booking = bookingsById.get(l.booking_id);
    const amenity = booking ? amenitiesById.get(booking.amenity_id) : undefined;
    name = amenity && booking ? `${amenity.name} · ${formatWhen(booking.start_time, booking.end_time)}` : "Booking";
  } else if (l.amount > 0) {
    name = "Monthly allowance";
  }
  return {
    id: String(l.id),
    name,
    date: formatLedgerDate(l.created_at),
    amount: l.amount,
  };
}

/** eligibility has no dedicated backend field/endpoint yet — kept as
 * static UI copy, same as before this wiring pass. */
export function mapUser(u: BackendUser): User {
  return {
    id: u.id,
    name: u.name,
    org: u.company,
    building: u.building,
    role: u.role === "admin" ? "admin" : "employee",
    avatarInitial: u.name.charAt(0).toUpperCase(),
    eligibility: "All amenities",
    voiceEnabled: true,
  };
}
