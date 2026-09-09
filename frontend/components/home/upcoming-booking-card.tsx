import Link from "next/link";
import type { Booking } from "@/lib/types";

export function UpcomingBookingCard({ booking }: { booking: Booking }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-[18px] transition-[border-color,transform] hover:border-[#cfd6d2] hover:-translate-y-px">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[15px] font-semibold tracking-[-0.2px]">
          {booking.amenityName}
        </div>
        <span className="text-[10.5px] tracking-[.07em] font-mono text-accent border border-accent-border bg-accent-bg rounded-full px-2 py-[3px] whitespace-nowrap">
          CONFIRMED
        </span>
      </div>
      <div className="mt-[9px] text-[13px] text-text-secondary">{booking.when}</div>
      <div className="mt-4 pt-3 border-t border-border-hairline-2 flex items-center justify-between">
        <span className="text-[12.5px] text-text-faint">{booking.meta}</span>
        <Link
          href="/pass"
          className="border border-border bg-surface text-text-secondary-2 rounded-md px-[10px] py-[6px] text-xs hover:border-[#c9c9c1]"
        >
          Access pass
        </Link>
      </div>
    </div>
  );
}
