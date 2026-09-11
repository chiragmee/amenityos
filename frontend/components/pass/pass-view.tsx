"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as api from "@/lib/api-client";
import { useAppState } from "@/lib/app-state";
import { placeholderQrDataUri } from "@/lib/qr";
import { StatusPill } from "@/components/ui/status-pill";

export function PassView({ bookingId }: { bookingId?: string }) {
  const { upcomingBookings, pastBookings } = useAppState();
  const all = [...upcomingBookings, ...pastBookings];
  const booking = bookingId
    ? all.find((b) => b.id === bookingId)
    : upcomingBookings[0];

  const [verified, setVerified] = useState<{ allowed: boolean; reason?: string } | null>(
    null
  );

  useEffect(() => {
    if (!booking?.accessToken) return;
    let cancelled = false;
    api
      .verifyAccess(booking.accessToken)
      .then((result) => {
        if (!cancelled) setVerified(result);
      })
      .catch(() => {
        if (!cancelled) setVerified({ allowed: false, reason: "TOKEN_INVALID" });
      });
    return () => {
      cancelled = true;
    };
  }, [booking?.accessToken]);

  if (!booking) {
    return (
      <section className="animate-rise max-w-[520px] mx-auto text-center py-16">
        <h1 className="m-0 text-2xl font-semibold tracking-[-0.5px]">Access pass</h1>
        <p className="mt-3 text-[14px] text-text-muted">
          No booking selected. Pick one from your bookings to see its access pass.
        </p>
        <Link
          href="/bookings"
          className="mt-5 inline-block border border-border bg-surface text-text-secondary-2 rounded-lg px-4 py-[10px] text-[13px] hover:border-[#c9c9c1]"
        >
          Go to My Bookings
        </Link>
      </section>
    );
  }

  const isActive = booking.status === "confirmed" && (verified?.allowed ?? true);

  return (
    <section className="animate-rise max-w-[520px] mx-auto">
      <h1 className="m-0 text-2xl md:text-[26px] font-semibold tracking-[-0.5px]">
        Access pass
      </h1>

      <div className="mt-5 bg-surface border border-border rounded-[24px] p-8 text-center shadow-[0_2px_8px_rgba(34,38,43,0.06)]">
        {isActive ? (
          <>
            <StatusPill tone="accent">Active</StatusPill>
            <img
              src={placeholderQrDataUri()}
              alt="Access QR code"
              className="block mx-auto mt-[26px] w-[232px] h-[232px] border border-border rounded-2xl animate-pop"
            />
            <div className="mt-[18px] text-[13px] text-text-disabled">
              {booking.displayId}
            </div>
          </>
        ) : (
          <>
            <StatusPill tone="neutral">
              {booking.status === "cancelled" ? "Cancelled" : "Expired"}
            </StatusPill>
            <img
              src={placeholderQrDataUri()}
              alt="Expired QR code"
              className="block mx-auto mt-[26px] w-[232px] h-[232px] border border-border-subtle rounded-2xl grayscale opacity-[.24]"
            />
            <div className="mt-[18px] text-[13.5px] text-text-disabled">
              This access pass is no longer valid.
            </div>
          </>
        )}

        <div className="mt-[26px] pt-6 border-t border-border-hairline text-left grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-[18px]">
          <div>
            <div className="text-[11px] tracking-[.06em] text-text-faint-2 font-mono">
              AMENITY
            </div>
            <div className="mt-[5px] text-sm font-medium">{booking.amenityName}</div>
          </div>
          <div>
            <div className="text-[11px] tracking-[.06em] text-text-faint-2 font-mono">
              LOCATION
            </div>
            <div className="mt-[5px] text-sm font-medium">{booking.place}</div>
          </div>
          <div>
            <div className="text-[11px] tracking-[.06em] text-text-faint-2 font-mono">
              VALID
            </div>
            <div className="mt-[5px] text-sm font-medium">{booking.when}</div>
          </div>
          <div>
            <div className="text-[11px] tracking-[.06em] text-text-faint-2 font-mono">
              ATTENDEES
            </div>
            <div className="mt-[5px] text-sm font-medium">{booking.attendees}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          href="/bookings"
          className="border border-border bg-surface text-text-secondary-2 rounded-lg px-[15px] py-[10px] text-[13px] hover:border-[#c9c9c1]"
        >
          Back to bookings
        </Link>
        <button className="border border-border bg-surface text-text-secondary-2 rounded-lg px-[15px] py-[10px] text-[13px] hover:border-[#c9c9c1]">
          Add to calendar
        </button>
      </div>
    </section>
  );
}
