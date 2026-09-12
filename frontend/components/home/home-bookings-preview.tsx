"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAppState } from "@/lib/app-state";
import { parseBackendDate } from "@/lib/backend-time";
import type { Booking } from "@/lib/types";
import { UpcomingBookingCard } from "./upcoming-booking-card";

const MAX_PREVIEW = 6;

function classify(booking: Booking, nowMs: number): "active" | "upcoming" | "past" {
  if (booking.status !== "confirmed") return "past";
  const start = parseBackendDate(booking.startTime).getTime();
  const end = parseBackendDate(booking.endTime).getTime();
  if (start <= nowMs && nowMs <= end) return "active";
  if (start > nowMs) return "upcoming";
  return "past";
}

function Section({
  title,
  bookings,
  section,
}: {
  title: string;
  bookings: Booking[];
  section: "active" | "upcoming" | "past";
}) {
  if (bookings.length === 0) return null;
  return (
    <div className="mt-5 first:mt-0">
      <div className="text-[11px] tracking-[.08em] font-mono text-text-faint-2 mb-[10px]">{title}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[14px]">
        {bookings.map((b) => (
          <UpcomingBookingCard key={b.id} booking={b} section={section} />
        ))}
      </div>
    </div>
  );
}

export function HomeBookingsPreview() {
  const { upcomingBookings, pastBookings } = useAppState();

  const { activePreview, upcomingPreview, pastPreview, total } = useMemo(() => {
    const now = Date.now();
    const all = [...upcomingBookings, ...pastBookings];

    const active: Booking[] = [];
    const upcoming: Booking[] = [];
    const past: Booking[] = [];
    for (const b of all) {
      const group = classify(b, now);
      if (group === "active") active.push(b);
      else if (group === "upcoming") upcoming.push(b);
      else past.push(b);
    }

    // Soonest upcoming first; most-recently-ended past first.
    upcoming.sort((a, b) => parseBackendDate(a.startTime).getTime() - parseBackendDate(b.startTime).getTime());
    past.sort((a, b) => parseBackendDate(b.endTime).getTime() - parseBackendDate(a.endTime).getTime());

    // Priority order for the capped preview: active, then nearest upcoming, then most recent past.
    const ordered = [...active, ...upcoming, ...past];
    const previewIds = new Set(ordered.slice(0, MAX_PREVIEW).map((b) => b.id));

    return {
      activePreview: active.filter((b) => previewIds.has(b.id)),
      upcomingPreview: upcoming.filter((b) => previewIds.has(b.id)),
      pastPreview: past.filter((b) => previewIds.has(b.id)),
      total: all.length,
    };
  }, [upcomingBookings, pastBookings]);

  return (
    <>
      <div className="mt-11 flex items-baseline gap-3">
        <h2 className="m-0 text-[17px] font-semibold tracking-[-0.2px] text-text-primary">My Bookings</h2>
        <Link href="/bookings" className="text-[12.5px] text-text-secondary hover:text-text-primary">
          View all
        </Link>
      </div>

      {total === 0 ? (
        <div className="mt-[14px] text-sm text-text-disabled">
          No quiet spaces booked yet. Try asking for one above.
        </div>
      ) : (
        <div className="mt-[14px]">
          <Section title="ACTIVE" bookings={activePreview} section="active" />
          <Section title="UPCOMING" bookings={upcomingPreview} section="upcoming" />
          <Section title="PAST" bookings={pastPreview} section="past" />
        </div>
      )}
    </>
  );
}
