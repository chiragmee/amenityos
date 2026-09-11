import Link from "next/link";
import { placeholderQrDataUri } from "@/lib/qr";
import type { Booking } from "@/lib/types";

export function BookingConfirmCard({
  booking,
  onAskAgain,
}: {
  booking: Booking;
  onAskAgain: () => void;
}) {
  return (
    <div className="mt-[22px] bg-surface border border-border rounded-[14px] p-[26px] grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-7 animate-rise shadow-[0_1px_2px_rgba(27,27,25,.04)]">
      <div>
        <div className="flex items-center gap-[10px]">
          <span className="text-[11px] tracking-[.08em] font-mono text-accent border border-accent-border bg-accent-bg rounded-full px-[9px] py-[3px]">
            CONFIRMED
          </span>
          <span className="text-[11.5px] text-text-faint-2 font-mono">
            {booking.displayId}
          </span>
        </div>
        <h3 className="mt-[14px] text-2xl font-semibold tracking-[-0.5px]">
          {booking.amenityName}
        </h3>
        <div className="mt-1 text-[13.5px] text-text-faint">{booking.place}</div>
        <div className="mt-[22px] grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-[18px] border-t border-border-hairline pt-[18px]">
          <div>
            <div className="text-[11px] tracking-[.06em] text-text-faint-2 font-mono">
              WHEN
            </div>
            <div className="mt-[5px] text-sm font-medium">
              {booking.when.split(" · ")[0]}
            </div>
            <div className="text-sm text-text-secondary">
              {booking.when.split(" · ")[1]}
            </div>
          </div>
          <div>
            <div className="text-[11px] tracking-[.06em] text-text-faint-2 font-mono">
              ATTENDEES
            </div>
            <div className="mt-[5px] text-sm font-medium">
              {booking.attendees} people
            </div>
          </div>
          <div>
            <div className="text-[11px] tracking-[.06em] text-text-faint-2 font-mono">
              COST
            </div>
            <div className="mt-[5px] text-sm font-medium">
              {booking.costCredits > 0 ? `${booking.costCredits} credits` : "Free"}
            </div>
          </div>
        </div>
        <div className="mt-[22px] flex flex-wrap gap-2">
          <Link
            href={`/pass/${booking.id}`}
            className="border-0 bg-dark text-white rounded-lg px-[15px] py-[10px] text-[13px] font-medium hover:bg-accent"
          >
            View booking
          </Link>
          <button className="border border-border bg-surface text-text-secondary-2 rounded-lg px-[15px] py-[10px] text-[13px] hover:border-[#c9c9c1]">
            Add to calendar
          </button>
          <button
            onClick={onAskAgain}
            className="border border-danger-border bg-surface text-danger rounded-lg px-[15px] py-[10px] text-[13px] hover:bg-danger-bg"
          >
            Cancel booking
          </button>
        </div>
      </div>
      <div className="w-full md:w-[196px] text-center md:border-l border-border-hairline md:pl-[26px]">
        <img
          src={placeholderQrDataUri()}
          alt="Access QR code"
          className="w-[150px] h-[150px] border border-border-rule rounded-lg animate-pop mx-auto"
        />
        <div className="mt-3 text-[11.5px] text-text-faint leading-[1.5]">
          Show this QR code at the amenity entrance.
        </div>
      </div>
    </div>
  );
}
