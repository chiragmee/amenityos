export type AmenityType =
  | "Meeting room"
  | "Conference room"
  | "Fitness"
  | "Theater"
  | "Recreation";

export interface Amenity {
  id: string;
  name: string;
  type: AmenityType;
  building: string;
  floor: string;
  capacity: number;
  costCredits: number;
  active: boolean;

  workingHours: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  availableDays: string;
  minDurationMins: number;
  maxDurationMins: number;
  defaultDurationMins: number;
  allowedDurations: number[];
  allowedDurationsLabel: string;
  advanceBookingHours: number;
  advanceBookingDaysLabel: string;

  maxActiveBookingsPerUser: number;
  bookingFrequency: string;
  eligibilityRule: string;
  cancellationPolicy: string;

  description: string;
  guidelines: string;
  shotLabel: string;
  availabilityLabel: string;

  lastEditedAt: string | null;
  lastEditedBy: string | null;
}

export type BookingStatus = "confirmed" | "completed" | "cancelled";

export interface Booking {
  id: string;
  displayId: string;
  amenityId: string;
  amenityName: string;
  place: string;
  when: string;
  meta: string;
  attendees: number;
  costCredits: number;
  status: BookingStatus;
  createdVia: "voice" | "text" | "manual";
  accessToken: string | null;
  startTime: string;
  endTime: string;
}

export interface CreditLedgerEntry {
  id: string;
  name: string;
  date: string;
  amount: number;
}

export interface User {
  id: string;
  name: string;
  org: string;
  building: string;
  role: "employee" | "admin";
  avatarInitial: string;
  eligibility: string;
  voiceEnabled: boolean;
}

export type ScenarioKey = "unavailable" | "paid" | "low" | "capacity";

export interface ScenarioOption {
  name: string;
  detail: string;
  tag: string;
}

export interface ScenarioAction {
  label: string;
  kind: "primary" | "secondary";
}

export interface ScenarioTurn {
  user: string;
  agent: string;
  options: ScenarioOption[];
  optionsTitle: string;
  actions: ScenarioAction[];
  resultTitle: string | null;
  resultBody: string | null;
  blockTitle: string | null;
  blockBody: string | null;
  trace: string;
}
