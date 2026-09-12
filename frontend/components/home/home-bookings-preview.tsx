"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAppState } from "@/lib/app-state";
import { parseBackendDate } from "@/lib/backend-time";
import type { Booking } from "@/lib/types";
import { UpcomingBookingCard } from "./upcoming-booking-card";

const MAX_PREVIEW = 6;

type Section = "active" | "upcoming" | "past";

const TABS: { key: Section; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
];

function classify(booking: Booking, nowMs: number): Section {
  if (booking.status !== "confirmed") return "past";
  const start = parseBackendDate(booking.startTime).getTime();
  const end = parseBackendDate(booking.endTime).getTime();
  if (start <= nowMs && nowMs <= end) return "active";
  if (start > nowMs) return "upcoming";
  return "past";
}

export function HomeBookingsPreview() {
  const { upcomingBookings, pastBookings } = useAppState();

  const { bySection, total } = useMemo(() => {
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

    return {
      bySection: {
        active: active.slice(0, MAX_PREVIEW),
        upcoming: upcoming.slice(0, MAX_PREVIEW),
        past: past.slice(0, MAX_PREVIEW),
      },
      total: all.length,
    };
  }, [upcomingBookings, pastBookings]);

  const defaultTab: Section =
    bySection.active.length > 0 ? "active" : bySection.upcoming.length > 0 ? "upcoming" : "past";
  const [tab, setTab] = useState<Section>(defaultTab);

  const current = bySection[tab];

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
          <div className="flex items-center gap-1 border-b border-border-subtle">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={
                  t.key === tab
                    ? "relative px-4 py-2 text-[13.5px] font-medium text-text-primary"
                    : "relative px-4 py-2 text-[13.5px] text-text-secondary hover:text-text-primary transition-colors"
                }
              >
                {t.label}
                <span className="ml-[6px] text-[11.5px] text-text-disabled">{bySection[t.key].length}</span>
                {t.key === tab && (
                  <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-brand rounded-full" />
                )}
              </button>
            ))}
          </div>

          {current.length === 0 ? (
            <div className="mt-4 text-sm text-text-disabled">
              {tab === "active" && "Nothing happening right now."}
              {tab === "upcoming" && "Nothing coming up."}
              {tab === "past" && "No past bookings yet."}
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[14px]">
              {current.map((b) => (
                <UpcomingBookingCard key={b.id} booking={b} section={tab} />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
