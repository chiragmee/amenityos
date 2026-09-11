"use client";

import type { Amenity } from "@/lib/types";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[12.5px] text-text-muted-2 mb-[6px]">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full border border-border rounded-[7px] px-[10px] py-[9px] text-[13.5px] bg-surface text-text outline-none focus:border-accent";

export function AmenityForm({
  amenity,
  guidelines,
}: {
  amenity: Amenity | null;
  guidelines: string;
}) {
  const a = amenity;
  const typeOptions = ["Meeting room", "Conference room", "Fitness", "Recreation", "Theater"];
  const freePaidOptions = a && a.costCredits !== 0 ? ["Paid", "Free"] : ["Free", "Paid"];

  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="border-b border-border-hairline-2 px-6 py-[22px]">
          <div className="text-[11px] tracking-[.08em] font-mono text-text-faint-2">
            IDENTITY
          </div>
          <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
            <Field label="Amenity name">
              <input className={inputClass} defaultValue={a?.name ?? ""} />
            </Field>
            <Field label="Amenity type">
              <select className={inputClass} defaultValue={a?.type}>
                {typeOptions.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="Description">
              <input className={inputClass} defaultValue={a?.description ?? ""} />
            </Field>
          </div>
        </div>

        <div className="border-b border-border-hairline-2 px-6 py-[22px]">
          <div className="text-[11px] tracking-[.08em] font-mono text-text-faint-2">
            LOCATION
          </div>
          <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
            <Field label="Building">
              <select className={inputClass} defaultValue={a?.building ?? "Tower A"}>
                {["Tower A", "Tower B", "Annexe"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="Floor">
              <input className={inputClass} defaultValue={a?.floor ?? ""} />
            </Field>
            <Field label="Capacity">
              <input className={inputClass} defaultValue={a ? String(a.capacity) : ""} />
            </Field>
            <Field label="Latitude">
              <input className={inputClass} defaultValue="12.9716" />
            </Field>
            <Field label="Longitude">
              <input className={inputClass} defaultValue="77.5946" />
            </Field>
          </div>
        </div>

        <div className="border-b border-border-hairline-2 px-6 py-[22px]">
          <div className="text-[11px] tracking-[.08em] font-mono text-text-faint-2">
            SCHEDULE
          </div>
          <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
            <Field label="Working hours">
              <input className={inputClass} defaultValue={a?.workingHours ?? "08:00 – 20:00"} />
            </Field>
            <Field label="Available days">
              <select className={inputClass} defaultValue={a?.availableDays}>
                {["Monday–Friday", "All days", "Weekends only"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="Minimum duration">
              <select className={inputClass}>
                {["30 minutes", "1 hour"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="Maximum duration">
              <select className={inputClass}>
                {["2 hours", "4 hours", "Full day"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="Default duration">
              <select className={inputClass}>
                {["1 hour", "30 minutes"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="Allowed durations">
              <input className={inputClass} defaultValue={a?.allowedDurationsLabel ?? ""} />
            </Field>
            <Field label="Advance booking window">
              <select className={inputClass} defaultValue={a?.advanceBookingDaysLabel}>
                {["14 days", "7 days", "30 days"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <div className="px-6 py-[22px]">
          <div className="text-[11px] tracking-[.08em] font-mono text-text-faint-2">
            RULES &amp; PRICING
          </div>
          <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
            <Field label="Maximum bookings per user">
              <input className={inputClass} defaultValue={a ? `${a.maxActiveBookingsPerUser} active` : "3 active"} />
            </Field>
            <Field label="Booking frequency">
              <select className={inputClass} defaultValue={a?.bookingFrequency}>
                {["2 per day", "1 per day", "Unlimited"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="Free / Paid">
              <select className={inputClass}>
                {freePaidOptions.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="Credit cost">
              <input className={inputClass} defaultValue={a ? String(a.costCredits) : "0"} />
            </Field>
            <Field label="Eligibility rules">
              <select className={inputClass} defaultValue={a?.eligibilityRule}>
                {["All employees", "Managers and above", "Named list"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="Cancellation policy">
              <select className={inputClass} defaultValue={a?.cancellationPolicy}>
                {["Free until 30 min before", "Free until 2 h before", "Non-refundable"].map(
                  (o) => (
                    <option key={o}>{o}</option>
                  )
                )}
              </select>
            </Field>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl px-6 py-[22px] lg:sticky lg:top-[96px]">
        <div className="text-[11px] tracking-[.08em] font-mono text-text-faint-2">
          AMENITY GUIDELINES
        </div>
        <p className="mt-[10px] text-[12.5px] text-text-faint leading-[1.55]">
          Plain-language rules. The assistant reads these when resolving requests.
        </p>
        <textarea
          key={guidelines}
          defaultValue={guidelines}
          placeholder="Maximum booking duration: 2 hours&#10;Maximum attendees: 8&#10;External guests: Not allowed"
          rows={11}
          className="mt-[14px] w-full border border-border rounded-lg p-3 text-[13px] leading-[1.7] font-mono text-text bg-[#fcfcfa] outline-none resize-y focus:border-accent"
        />
        <div className="mt-[14px] flex items-center gap-2">
          <span className="w-[6px] h-[6px] rounded-full bg-accent" />
          <span className="text-xs text-text-muted-2">6 rules parsed · 0 conflicts</span>
        </div>
      </div>
    </div>
  );
}
