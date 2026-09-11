"use client";

import Link from "next/link";
import { useAppState } from "@/lib/app-state";
import { StatusPill } from "@/components/ui/status-pill";
import type { Booking, BookingStatus } from "@/lib/types";

function toneFor(status: BookingStatus) {
  if (status === "confirmed") return "accent" as const;
  if (status === "cancelled") return "danger" as const;
  return "neutral" as const;
}

function Row({ booking }: { booking: Booking }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)_minmax(0,1fr)_auto] gap-2 sm:gap-[14px] px-5 sm:px-5 py-4 border-b border-border-hairline-2 last:border-b-0 items-center hover:bg-[#fcfcfa]">
      <div>
        <div className="text-[14.5px] font-medium">{booking.amenityName}</div>
        <div className="mt-[3px] text-xs text-text-faint-2">
          {booking.place} · {booking.displayId}
        </div>
      </div>
      <div className="text-[13.5px] text-text-secondary">{booking.when}</div>
      <div className="text-[13.5px] text-text-secondary">{booking.meta}</div>
      <div className="flex items-center gap-[10px]">
        <StatusPill tone={toneFor(booking.status)}>
          {booking.status.toUpperCase()}
        </StatusPill>
        <Link
          href={`/pass/${booking.id}`}
          className="border border-border bg-surface text-text-secondary-2 rounded-md px-[10px] py-[6px] text-xs hover:border-[#c9c9c1]"
        >
          Pass
        </Link>
      </div>
    </div>
  );
}

export default function BookingsPage() {
  const { upcomingBookings, pastBookings } = useAppState();
  const all = [...upcomingBookings, ...pastBookings];

  return (
    <section className="animate-rise">
      <h1 className="m-0 text-[26px] md:text-[28px] font-semibold tracking-[-0.6px]">
        My bookings
      </h1>
      <p className="mt-2 text-[15px] text-text-muted">
        {upcomingBookings.length} upcoming · {pastBookings.length} past
      </p>
      <div className="mt-6 bg-surface border border-border rounded-xl overflow-hidden">
        <div className="hidden sm:grid grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)_minmax(0,1fr)_auto] gap-[14px] px-5 py-[11px] bg-[#fafaf8] border-b border-border-hairline text-[11px] tracking-[.07em] font-mono text-text-faint-2">
          <div>AMENITY</div>
          <div>WHEN</div>
          <div>COST</div>
          <div>STATUS</div>
        </div>
        {all.map((b) => (
          <Row key={b.id} booking={b} />
        ))}
      </div>
    </section>
  );
}
