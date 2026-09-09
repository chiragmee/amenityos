"use client";

import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/app-state";
import type { Amenity } from "@/lib/types";

function priceLabel(a: Amenity) {
  return a.costCredits === 0 ? "Free" : `${a.costCredits} credits`;
}

export function AmenityCard({ amenity }: { amenity: Amenity }) {
  const router = useRouter();
  const { setPendingPrefill } = useAppState();

  const handleBook = () => {
    const text = `Book ${amenity.name} today at 3 PM for ${Math.min(5, amenity.capacity)} people`;
    setPendingPrefill(text);
    router.push("/");
  };

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col transition-[border-color,transform,box-shadow] hover:border-[#cfd6d2] hover:-translate-y-[2px] hover:shadow-[0_8px_20px_rgba(27,27,25,.05)]">
      <div
        className="h-[132px] flex items-end justify-between px-3 py-[10px]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, #f0f0ea 0 8px, #e8e8e1 8px 16px)",
        }}
      >
        <span className="text-[10.5px] font-mono text-text-faint-2 bg-white/80 rounded px-[6px] py-[3px]">
          {amenity.shotLabel}
        </span>
        <span className="text-[10.5px] font-mono text-text-secondary-2 bg-white/90 rounded px-[6px] py-[3px]">
          {amenity.availabilityLabel}
        </span>
      </div>
      <div className="px-[18px] pt-4 pb-[18px] flex flex-col flex-1">
        <div className="flex items-start justify-between gap-[10px]">
          <div className="text-[15.5px] font-semibold tracking-[-0.2px]">
            {amenity.name}
          </div>
          <span className="text-[11px] tracking-[.05em] font-mono text-text-muted-2 border border-border-rule rounded-full px-2 py-[3px] whitespace-nowrap">
            {priceLabel(amenity)}
          </span>
        </div>
        <div className="mt-[5px] text-[12.5px] text-text-faint">
          {amenity.building} · Floor {amenity.floor}
        </div>
        <div className="mt-3 text-[12.5px] text-text-secondary">
          Capacity {amenity.capacity}
        </div>
        <div className="flex-1" />
        <button
          onClick={handleBook}
          className="mt-4 border border-border bg-surface text-text rounded-lg px-3 py-[9px] text-[13px] font-medium w-full text-center hover:bg-dark hover:text-white hover:border-dark"
        >
          Book
        </button>
      </div>
    </div>
  );
}
