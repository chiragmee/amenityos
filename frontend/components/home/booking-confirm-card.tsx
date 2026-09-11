import Link from "next/link";
import { placeholderQrDataUri } from "@/lib/qr";
import type { Booking } from "@/lib/types";
import { StatusPill } from "@/components/ui/status-pill";

export function BookingConfirmCard({
  booking,
  onAskAgain,
}: {
  booking: Booking;
  onAskAgain: () => void;
}) {
  return (
    <div className="mt-5 bg-surface border border-border rounded-[24px] p-[26px] grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-7 animate-rise shadow-[0_2px_8px_rgba(34,38,43,0.06)]">
      <div>
        <div className="flex items-center gap-[10px]">
          <StatusPill tone="accent">Confirmed</StatusPill>
          <span className="text-[11.5px] text-text-disabled">{booking.displayId}</span>
        </div>
        <h3 className="mt-[14px] text-2xl font-semibold tracking-[-0.4px] text-text-primary">
          {booking.amenityName}
        </h3>
        <div className="mt-1 text-[13.5px] text-text-disabled">{booking.place}</div>
        <div className="mt-[22px] grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-[18px] border-t border-border-subtle pt-[18px]">
          <div>
            <div className="text-[11px] text-text-disabled">When</div>
            <div className="mt-[5px] text-sm font-medium text-text-primary">
              {booking.when.split(" · ")[0]}
            </div>
            <div className="text-sm text-text-secondary">
              {booking.when.split(" · ")[1]}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-text-disabled">Attendees</div>
            <div className="mt-[5px] text-sm font-medium text-text-primary">
              {booking.attendees} people
            </div>
          </div>
          <div>
            <div className="text-[11px] text-text-disabled">Cost</div>
            <div className="mt-[5px] text-sm font-medium text-text-primary">
              {booking.costCredits > 0 ? `${booking.costCredits} credits` : "Free"}
            </div>
          </div>
        </div>
        <div className="mt-[22px] flex flex-wrap gap-2">
          <Link
            href={`/pass/${booking.id}`}
            className="border-0 bg-brand text-white rounded-full px-[18px] py-[10px] text-[13px] font-medium hover:bg-brand-dark"
          >
            View booking
          </Link>
          <button className="border border-border bg-surface text-text-secondary rounded-full px-[18px] py-[10px] text-[13px] hover:border-text-disabled">
            Add to calendar
          </button>
          <button
            onClick={onAskAgain}
            className="border border-danger-border-tint bg-surface text-danger rounded-full px-[18px] py-[10px] text-[13px] hover:bg-danger-tint"
          >
            Cancel booking
          </button>
        </div>
      </div>
      <div className="w-full md:w-[196px] text-center md:border-l border-border-subtle md:pl-[26px]">
        <img
          src={placeholderQrDataUri()}
          alt="Access QR code"
          className="w-[150px] h-[150px] border border-border rounded-2xl animate-pop mx-auto"
        />
        <div className="mt-3 text-[11.5px] text-text-disabled leading-[1.5]">
          Show this QR code at the amenity entrance.
        </div>
      </div>
    </div>
  );
}
