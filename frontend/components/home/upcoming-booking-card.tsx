import Link from "next/link";
import type { Booking } from "@/lib/types";
import { StatusPill } from "@/components/ui/status-pill";

export function UpcomingBookingCard({ booking }: { booking: Booking }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 transition-[border-color,transform] hover:border-text-disabled hover:-translate-y-px">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[15px] font-semibold tracking-[-0.2px] text-text-primary">
          {booking.amenityName}
        </div>
        <StatusPill tone="accent">Confirmed</StatusPill>
      </div>
      <div className="mt-[9px] text-[13px] text-text-secondary">{booking.when}</div>
      <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between">
        <span className="text-[12.5px] text-text-disabled">{booking.meta}</span>
        <Link
          href={`/pass/${booking.id}`}
          className="border border-border bg-surface text-text-secondary rounded-full px-[10px] py-[6px] text-xs hover:border-text-disabled"
        >
          Access pass
        </Link>
      </div>
    </div>
  );
}
