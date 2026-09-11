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
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;

  workingHoursStart: string;
  workingHoursEnd: string;
  workingHours: string;
  minDurationMins: number;
  maxDurationMins: number;
  defaultDurationMins: number;
  allowedDurations: number[];
  allowedDurationsLabel: string;
  advanceBookingHours: number;
  advanceBookingDaysLabel: string;

  maxActiveBookingsPerUser: number;
  cancellationWindowMinutes: number;
  eligibleRoles: string[];
  eligibleCompanies: string[];
  allowedWeekdays: string[];

  description: string;
  guidelines: string;
  shotLabel: string;
  availabilityLabel: string;
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
  role: "employee" | "manager" | "admin" | "guest";
  avatarInitial: string;
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
