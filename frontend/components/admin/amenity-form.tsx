"use client";

import { ROLE_OPTIONS, TYPE_OPTIONS, WEEKDAY_OPTIONS, type AmenityFormValues } from "./use-amenity-form";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[12.5px] text-text-muted-2 mb-[6px]">
        {label}
        {hint && <span className="text-text-faint-2"> ({hint})</span>}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full border border-border rounded-[7px] px-[10px] py-[9px] text-[13.5px] bg-surface text-text outline-none focus:border-accent";

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-[6px] text-[13px] text-text-secondary-2 border border-border rounded-full px-3 py-[6px] cursor-pointer has-[:checked]:border-accent has-[:checked]:text-accent">
      <input type="checkbox" checked={checked} onChange={onChange} className="accent-accent" />
      {label}
    </label>
  );
}

export function AmenityForm({
  values,
  set,
  toggleListValue,
}: {
  values: AmenityFormValues;
  set: <K extends keyof AmenityFormValues>(key: K, value: AmenityFormValues[K]) => void;
  toggleListValue: (key: "eligibleRoles" | "allowedWeekdays", value: string) => void;
}) {
  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="border-b border-border-hairline-2 px-6 py-[22px]">
          <div className="text-[11px] tracking-[.08em] font-mono text-text-faint-2">
            IDENTITY
          </div>
          <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
            <Field label="Amenity name">
              <input
                className={inputClass}
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </Field>
            <Field label="Amenity type">
              <select
                className={inputClass}
                value={values.type}
                onChange={(e) => set("type", e.target.value as AmenityFormValues["type"])}
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="Description">
              <input
                className={inputClass}
                value={values.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </Field>
          </div>
        </div>

        <div className="border-b border-border-hairline-2 px-6 py-[22px]">
          <div className="text-[11px] tracking-[.08em] font-mono text-text-faint-2">
            LOCATION
          </div>
          <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
            <Field label="Building">
              <select
                className={inputClass}
                value={values.building}
                onChange={(e) => set("building", e.target.value)}
              >
                {["Tower A", "Tower B", "Annexe"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="Floor">
              <input
                className={inputClass}
                value={values.floor}
                onChange={(e) => set("floor", e.target.value)}
              />
            </Field>
            <Field label="Capacity">
              <input
                type="number"
                min={1}
                className={inputClass}
                value={values.capacity}
                onChange={(e) => set("capacity", e.target.value)}
              />
            </Field>
            <Field label="Latitude" hint="optional">
              <input
                className={inputClass}
                value={values.latitude}
                onChange={(e) => set("latitude", e.target.value)}
                placeholder="e.g. 12.9716"
              />
            </Field>
            <Field label="Longitude" hint="optional">
              <input
                className={inputClass}
                value={values.longitude}
                onChange={(e) => set("longitude", e.target.value)}
                placeholder="e.g. 77.5946"
              />
            </Field>
          </div>
        </div>

        <div className="border-b border-border-hairline-2 px-6 py-[22px]">
          <div className="text-[11px] tracking-[.08em] font-mono text-text-faint-2">
            SCHEDULE
          </div>
          <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
            <Field label="Working hours start">
              <input
                type="time"
                className={inputClass}
                value={values.workingHoursStart}
                onChange={(e) => set("workingHoursStart", e.target.value)}
              />
            </Field>
            <Field label="Working hours end">
              <input
                type="time"
                className={inputClass}
                value={values.workingHoursEnd}
                onChange={(e) => set("workingHoursEnd", e.target.value)}
              />
            </Field>
            <Field label="Minimum duration" hint="minutes">
              <input
                type="number"
                min={1}
                className={inputClass}
                value={values.minDurationMins}
                onChange={(e) => set("minDurationMins", e.target.value)}
              />
            </Field>
            <Field label="Maximum duration" hint="minutes">
              <input
                type="number"
                min={1}
                className={inputClass}
                value={values.maxDurationMins}
                onChange={(e) => set("maxDurationMins", e.target.value)}
              />
            </Field>
            <Field label="Default duration" hint="minutes">
              <input
                type="number"
                min={1}
                className={inputClass}
                value={values.defaultDurationMins}
                onChange={(e) => set("defaultDurationMins", e.target.value)}
              />
            </Field>
            <Field label="Allowed durations" hint="comma-separated minutes">
              <input
                className={inputClass}
                value={values.allowedDurations}
                onChange={(e) => set("allowedDurations", e.target.value)}
                placeholder="30, 60, 120"
              />
            </Field>
            <Field label="Advance booking window" hint="hours">
              <input
                type="number"
                min={1}
                className={inputClass}
                value={values.advanceBookingHours}
                onChange={(e) => set("advanceBookingHours", e.target.value)}
              />
            </Field>
          </div>
          <div className="mt-4">
            <span className="block text-[12.5px] text-text-muted-2 mb-[6px]">
              Available days <span className="text-text-faint-2">(none selected = every day)</span>
            </span>
            <div className="flex flex-wrap gap-[6px]">
              {WEEKDAY_OPTIONS.map((day) => (
                <Checkbox
                  key={day}
                  label={day.slice(0, 3)}
                  checked={values.allowedWeekdays.includes(day)}
                  onChange={() => toggleListValue("allowedWeekdays", day)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-[22px]">
          <div className="text-[11px] tracking-[.08em] font-mono text-text-faint-2">
            RULES &amp; PRICING
          </div>
          <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
            <Field label="Max active bookings per user">
              <input
                type="number"
                min={1}
                className={inputClass}
                value={values.maxActiveBookingsPerUser}
                onChange={(e) => set("maxActiveBookingsPerUser", e.target.value)}
              />
            </Field>
            <Field label="Cancellation window" hint="minutes notice for a refund">
              <input
                type="number"
                min={0}
                className={inputClass}
                value={values.cancellationWindowMinutes}
                onChange={(e) => set("cancellationWindowMinutes", e.target.value)}
              />
            </Field>
            <Field label="Free / Paid">
              <select
                className={inputClass}
                value={values.isPaid ? "Paid" : "Free"}
                onChange={(e) => set("isPaid", e.target.value === "Paid")}
              >
                <option>Free</option>
                <option>Paid</option>
              </select>
            </Field>
            {values.isPaid && (
              <Field label="Credit cost">
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={values.costCredits}
                  onChange={(e) => set("costCredits", e.target.value)}
                />
              </Field>
            )}
          </div>
          <div className="mt-4">
            <span className="block text-[12.5px] text-text-muted-2 mb-[6px]">
              Eligible roles <span className="text-text-faint-2">(none selected = everyone eligible)</span>
            </span>
            <div className="flex flex-wrap gap-[6px]">
              {ROLE_OPTIONS.map((role) => (
                <Checkbox
                  key={role}
                  label={role}
                  checked={values.eligibleRoles.includes(role)}
                  onChange={() => toggleListValue("eligibleRoles", role)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl px-6 py-[22px] lg:sticky lg:top-[96px]">
        <div className="text-[11px] tracking-[.08em] font-mono text-text-faint-2">
          AMENITY GUIDELINES
        </div>
        <p className="mt-[10px] text-[12.5px] text-text-faint leading-[1.55]">
          Plain-language rules. The assistant retrieves these when resolving requests.
        </p>
        <textarea
          value={values.guidelines}
          onChange={(e) => set("guidelines", e.target.value)}
          placeholder="Maximum booking duration: 2 hours&#10;Maximum attendees: 8&#10;External guests: Not allowed"
          rows={11}
          className="mt-[14px] w-full border border-border rounded-lg p-3 text-[13px] leading-[1.7] font-mono text-text bg-[#fcfcfa] outline-none resize-y focus:border-accent"
        />
      </div>
    </div>
  );
}
