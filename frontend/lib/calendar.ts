import { parseBackendDate } from "./backend-time";
import type { Booking } from "./types";

/** Floating (no timezone) ICS datetime — matches this app's wall-clock
 * convention (see backend-time.ts): the numbers are the intended
 * building-local time, not converted through any real timezone. */
function toIcsDateTime(iso: string): string {
  const d = parseBackendDate(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

function icsNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function downloadBookingIcs(booking: Booking): void {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Nookly//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${booking.id}@nookly`,
    `DTSTAMP:${icsNow()}`,
    `DTSTART:${toIcsDateTime(booking.startTime)}`,
    `DTEND:${toIcsDateTime(booking.endTime)}`,
    `SUMMARY:${escapeIcsText(booking.amenityName)}`,
    `LOCATION:${escapeIcsText(booking.place)}`,
    `DESCRIPTION:${escapeIcsText(`Booking ${booking.displayId}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${booking.displayId}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
