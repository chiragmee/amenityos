/**
 * The backend treats every timestamp as naive wall-clock — no real
 * timezone conversion happens anywhere (see backend/README.md's "known
 * simplifications"). A single-office MVP assumption: whatever numbers you
 * send ARE the intended building-local time, and whatever numbers come
 * back should be displayed as-is, not reinterpreted through the viewer's
 * actual timezone. `Date.toISOString()`/`new Date(iso)` both do real UTC
 * conversion, which silently breaks this assumption for any non-UTC
 * browser — these two helpers are the only correct way to cross this
 * boundary in either direction.
 */

/** Frontend Date (local wall-clock) -> backend wire format. Stamps the
 * LOCAL clock numbers with "Z" rather than converting to true UTC. */
export function toBackendIso(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}Z`
  );
}

/** Backend wire format -> frontend Date, preserving the wall-clock numbers
 * instead of shifting them through the viewer's real timezone. */
export function parseBackendDate(iso: string): Date {
  const clean = iso.endsWith("Z") ? iso.slice(0, -1) : iso;
  const [datePart, timePart = "00:00:00"] = clean.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute, second = "0"] = timePart.split(":");
  return new Date(year, month - 1, day, Number(hour), Number(minute), Number(second));
}
