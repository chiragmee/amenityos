"use client";

import { useEffect, useState } from "react";
import type { BackendAmenityWrite } from "@/lib/backend-types";
import type { Amenity, AmenityType } from "@/lib/types";

export const ROLE_OPTIONS = ["employee", "manager", "admin", "guest"];
export const WEEKDAY_OPTIONS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
export const TYPE_OPTIONS: AmenityType[] = [
  "Meeting room",
  "Conference room",
  "Fitness",
  "Recreation",
  "Theater",
];

function toDefaults(amenity: Amenity | null, guidelines: string) {
  return {
    name: amenity?.name ?? "",
    description: amenity?.description ?? "",
    type: (amenity?.type ?? TYPE_OPTIONS[0]) as AmenityType,
    building: amenity?.building ?? "Tower A",
    floor: amenity?.floor ?? "1",
    capacity: amenity ? String(amenity.capacity) : "1",
    latitude: amenity?.latitude != null ? String(amenity.latitude) : "",
    longitude: amenity?.longitude != null ? String(amenity.longitude) : "",
    workingHoursStart: amenity?.workingHoursStart ?? "08:00",
    workingHoursEnd: amenity?.workingHoursEnd ?? "20:00",
    minDurationMins: amenity ? String(amenity.minDurationMins) : "30",
    maxDurationMins: amenity ? String(amenity.maxDurationMins) : "120",
    defaultDurationMins: amenity ? String(amenity.defaultDurationMins) : "60",
    allowedDurations: amenity ? amenity.allowedDurations.join(", ") : "30, 60, 120",
    advanceBookingHours: amenity ? String(amenity.advanceBookingHours) : String(14 * 24),
    maxActiveBookingsPerUser: amenity ? String(amenity.maxActiveBookingsPerUser) : "3",
    cancellationWindowMinutes: amenity ? String(amenity.cancellationWindowMinutes) : "30",
    isPaid: amenity ? amenity.costCredits > 0 : false,
    costCredits: amenity ? String(amenity.costCredits) : "0",
    eligibleRoles: amenity?.eligibleRoles ?? ([] as string[]),
    allowedWeekdays: amenity?.allowedWeekdays ?? ([] as string[]),
    guidelines,
    isActive: amenity?.active ?? true,
  };
}

export type AmenityFormValues = ReturnType<typeof toDefaults>;

/** Owns all amenity-form state as controlled inputs, bound to real fields
 * only. Lifted into a hook (rather than living inside AmenityForm) because
 * the Save/Deactivate buttons live in the parent page's header, not in the
 * form component itself. */
export function useAmenityForm(amenity: Amenity | null, guidelines: string) {
  const [values, setValues] = useState<AmenityFormValues>(() => toDefaults(amenity, guidelines));

  useEffect(() => {
    setValues(toDefaults(amenity, guidelines));
    // Only re-initialize when switching amenities or when the async
    // guideline fetch resolves — not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amenity?.id, guidelines]);

  const set = <K extends keyof AmenityFormValues>(key: K, value: AmenityFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const toggleListValue = (key: "eligibleRoles" | "allowedWeekdays", value: string) => {
    setValues((v) => {
      const list = v[key];
      const next = list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
      return { ...v, [key]: next };
    });
  };

  const toPayload = (): BackendAmenityWrite => {
    const allowedDurations = values.allowedDurations
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);

    return {
      name: values.name,
      description: values.description,
      type: values.type,
      building: values.building,
      floor: Number(values.floor) || 0,
      capacity: Number(values.capacity) || 1,
      latitude: values.latitude.trim() ? Number(values.latitude) : null,
      longitude: values.longitude.trim() ? Number(values.longitude) : null,
      working_hours_start: values.workingHoursStart,
      working_hours_end: values.workingHoursEnd,
      minimum_duration_minutes: Number(values.minDurationMins) || 30,
      maximum_duration_minutes: Number(values.maxDurationMins) || 60,
      default_duration_minutes: Number(values.defaultDurationMins) || 60,
      allowed_durations: allowedDurations,
      advance_booking_hours: Number(values.advanceBookingHours) || 0,
      max_bookings_per_user: Number(values.maxActiveBookingsPerUser) || 1,
      cancellation_window_minutes: Number(values.cancellationWindowMinutes) || 0,
      is_paid: values.isPaid,
      credit_cost: values.isPaid ? Number(values.costCredits) || 0 : 0,
      eligible_roles: values.eligibleRoles,
      allowed_weekdays: values.allowedWeekdays,
      guideline: values.guidelines,
      is_active: values.isActive,
    };
  };

  return { values, set, toggleListValue, toPayload };
}
