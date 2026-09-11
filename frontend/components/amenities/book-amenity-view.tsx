"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as api from "@/lib/api-client";
import { useAppState } from "@/lib/app-state";
import { toBackendIso } from "@/lib/backend-time";
import { formatDuration } from "@/lib/format";

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toDateInputValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}
function buildDate(dateStr: string, timeStr: string): Date | null {
  if (!dateStr || !timeStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const [h, min] = timeStr.split(":").map(Number);
  if ([y, m, d, h, min].some((n) => Number.isNaN(n))) return null;
  return new Date(y, m - 1, d, h, min, 0);
}

type Preview =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "valid"; costCredits: number; balance: number }
  | { kind: "invalid"; message: string };

export function BookAmenityView({ amenityId }: { amenityId: string }) {
  const router = useRouter();
  const { findAmenity, credits, createRealBooking } = useAppState();
  const amenity = findAmenity(amenityId);

  const today = useMemo(() => new Date(), []);
  const [date, setDate] = useState(() => toDateInputValue(today));
  const [time, setTime] = useState(() => amenity?.workingHoursStart ?? "09:00");
  const [duration, setDuration] = useState<number>(
    amenity?.defaultDurationMins ?? amenity?.minDurationMins ?? 60
  );
  const [attendees, setAttendees] = useState(1);
  const [guidelines, setGuidelines] = useState<string>("");
  const [preview, setPreview] = useState<Preview>({ kind: "idle" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!amenityId) return;
    api
      .getAmenityPolicy(amenityId)
      .then((p) => setGuidelines(p.guidelines.map((g) => g.content).join("\n\n")))
      .catch(() => setGuidelines(""));
  }, [amenityId]);

  // Live validation against the real backend as the form changes.
  useEffect(() => {
    if (!amenity) return;
    const startTime = buildDate(date, time);
    if (!startTime || attendees < 1) {
      setPreview({ kind: "idle" });
      return;
    }
    setPreview({ kind: "loading" });
    const handle = setTimeout(() => {
      api
        .validateBooking({
          user_id: api.CURRENT_USER_ID,
          amenity_id: amenity.id,
          start_time: toBackendIso(startTime),
          duration_minutes: duration,
          attendee_count: attendees,
        })
        .then((r) => {
          if (r.valid) {
            setPreview({ kind: "valid", costCredits: r.credit_cost, balance: r.current_balance });
          } else {
            setPreview({ kind: "invalid", message: r.message ?? "This booking isn't valid." });
          }
        })
        .catch((err) => {
          setPreview({
            kind: "invalid",
            message: err instanceof api.ApiError ? err.message : "Couldn't check availability.",
          });
        });
    }, 350);
    return () => clearTimeout(handle);
  }, [amenity, date, time, duration, attendees]);

  if (!amenity) {
    return (
      <section className="animate-rise max-w-[520px] mx-auto text-center py-16">
        <h1 className="m-0 text-2xl font-semibold tracking-[-0.4px] text-text-primary">
          Space not found
        </h1>
        <p className="mt-3 text-[14px] text-text-secondary">
          This amenity isn&apos;t in the catalog (or hasn&apos;t loaded yet).
        </p>
        <Link
          href="/amenities"
          className="mt-5 inline-block border border-border bg-surface text-text-secondary rounded-full px-4 py-[10px] text-[13px] hover:border-text-disabled"
        >
          Back to amenities
        </Link>
      </section>
    );
  }

  const durationOptions =
    amenity.allowedDurations.length > 0
      ? amenity.allowedDurations
      : [amenity.minDurationMins, amenity.maxDurationMins];

  const canSubmit = preview.kind === "valid" && !submitting;

  const handleSubmit = async () => {
    const startTime = buildDate(date, time);
    if (!startTime) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const booking = await createRealBooking({
        amenityId: amenity.id,
        startTime,
        durationMinutes: duration,
        attendeeCount: attendees,
      });
      router.push(`/pass/${booking.id}`);
    } catch (err) {
      setSubmitError(err instanceof api.ApiError ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  };

  return (
    <section className="animate-rise max-w-[640px] mx-auto">
      <Link href="/amenities" className="text-[12.5px] text-text-secondary hover:text-text-primary">
        ← All amenities
      </Link>

      <div className="mt-3 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="m-0 text-2xl md:text-[28px] font-semibold tracking-[-0.4px] text-text-primary">
            {amenity.name}
          </h1>
          <p className="mt-1 text-[14px] text-text-secondary">
            {amenity.building} · Floor {amenity.floor} · Capacity {amenity.capacity}
          </p>
        </div>
        <span className="text-[12px] font-medium border border-border rounded-full px-3 py-1 text-text-secondary whitespace-nowrap">
          {amenity.costCredits === 0 ? "Free" : `${amenity.costCredits} credits`}
        </span>
      </div>

      {amenity.description && (
        <p className="mt-3 text-[14px] text-text-secondary leading-[1.6]">{amenity.description}</p>
      )}

      <div className="mt-6 bg-surface border border-border rounded-[24px] p-6 shadow-[0_2px_8px_rgba(34,38,43,0.06)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-[12.5px] text-text-secondary mb-[6px]">Date</span>
            <input
              type="date"
              value={date}
              min={toDateInputValue(today)}
              max={toDateInputValue(addDays(today, Math.ceil(amenity.advanceBookingHours / 24)))}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-border rounded-[10px] px-3 py-[9px] text-[14px] text-text-primary bg-surface outline-none focus:border-brand"
            />
          </label>

          <label className="block">
            <span className="block text-[12.5px] text-text-secondary mb-[6px]">
              Time <span className="text-text-disabled">({amenity.workingHours})</span>
            </span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full border border-border rounded-[10px] px-3 py-[9px] text-[14px] text-text-primary bg-surface outline-none focus:border-brand"
            />
          </label>

          <label className="block">
            <span className="block text-[12.5px] text-text-secondary mb-[6px]">Duration</span>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full border border-border rounded-[10px] px-3 py-[9px] text-[14px] text-text-primary bg-surface outline-none focus:border-brand"
            >
              {durationOptions.map((mins) => (
                <option key={mins} value={mins}>
                  {formatDuration(mins)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-[12.5px] text-text-secondary mb-[6px]">
              Attendees <span className="text-text-disabled">(up to {amenity.capacity})</span>
            </span>
            <input
              type="number"
              min={1}
              max={amenity.capacity}
              value={attendees}
              onChange={(e) => setAttendees(Math.max(1, Number(e.target.value) || 1))}
              className="w-full border border-border rounded-[10px] px-3 py-[9px] text-[14px] text-text-primary bg-surface outline-none focus:border-brand"
            />
          </label>
        </div>

        <div className="mt-5 min-h-[52px]">
          {preview.kind === "loading" && (
            <div className="text-[13px] text-text-disabled">Checking availability…</div>
          )}
          {preview.kind === "valid" && (
            <div className="flex items-center gap-[10px] border border-accent-border-tint bg-accent-tint rounded-[14px] px-4 py-3">
              <span className="w-[18px] h-[18px] rounded-full bg-accent text-white flex items-center justify-center text-[10px] shrink-0">
                ✓
              </span>
              <div className="text-[13.5px] text-text-primary">
                {preview.costCredits > 0
                  ? `Available · ${preview.costCredits} credits · you have ${credits}`
                  : "Available · free"}
              </div>
            </div>
          )}
          {preview.kind === "invalid" && (
            <div className="border border-danger-border-tint bg-danger-tint rounded-[14px] px-4 py-3 text-[13.5px] text-danger-dark">
              {preview.message}
            </div>
          )}
        </div>

        {submitError && (
          <div className="mt-3 border border-danger-border-tint bg-danger-tint rounded-[14px] px-4 py-3 text-[13.5px] text-danger-dark">
            {submitError}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="mt-5 w-full border-0 bg-brand text-white rounded-full py-3 text-[14px] font-medium hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? "Booking…" : "Book this space"}
        </button>
      </div>

      {guidelines && (
        <div className="mt-4 bg-surface-subtle border border-border-subtle rounded-[16px] p-5">
          <div className="text-[12px] text-text-disabled">Guidelines</div>
          <div className="mt-2 text-[13px] text-text-secondary leading-[1.7] whitespace-pre-line">
            {guidelines}
          </div>
        </div>
      )}
    </section>
  );
}
