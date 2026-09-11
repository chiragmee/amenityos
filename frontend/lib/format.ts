import { parseBackendDate } from "./backend-time";

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dayLabel(date: Date, now: Date = new Date()): string {
  const diffDays = Math.round(
    (startOfDay(date).getTime() - startOfDay(now).getTime()) / 86_400_000
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function timeLabel(date: Date): string {
  // Force uppercase AM/PM explicitly — some ICU locales render lowercase
  // by default, which would be inconsistent with the design's "3:00 PM".
  return date
    .toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true })
    .toUpperCase();
}

/** "Today · 3:00 PM – 4:00 PM" */
export function formatWhen(startIso: string, endIso: string): string {
  const start = parseBackendDate(startIso);
  const end = parseBackendDate(endIso);
  return `${dayLabel(start)} · ${timeLabel(start)} – ${timeLabel(end)}`;
}

/** "SEP 9, 2026" — matches the design's uppercase ledger date style. */
export function formatLedgerDate(iso: string): string {
  return parseBackendDate(iso)
    .toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    .toUpperCase();
}

/** [30, 60, 90] -> "30m, 1h, 1h30m" */
export function formatDurationsLabel(minutesList: number[]): string {
  return minutesList.map(formatDuration).join(", ");
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h${m}m`;
}

/** working_hours_start/end ("08:00","20:00") -> "08:00 – 20:00" */
export function formatHoursLabel(start: string, end: string): string {
  return `${start} – ${end}`;
}

/** advance_booking_hours (int) -> "14 days" */
export function formatAdvanceWindow(hours: number): string {
  const days = Math.round(hours / 24);
  return days <= 1 ? `${hours} hours` : `${days} days`;
}
