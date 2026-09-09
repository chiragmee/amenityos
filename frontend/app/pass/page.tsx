"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { placeholderQrDataUri } from "@/lib/qr";

export default function PassPage() {
  const [mode, setMode] = useState<"active" | "expired">("active");
  const [secs, setSecs] = useState(2832);

  useEffect(() => {
    const id = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  return (
    <section className="animate-rise max-w-[520px] mx-auto">
      <div className="flex items-center justify-between gap-3">
        <h1 className="m-0 text-2xl md:text-[26px] font-semibold tracking-[-0.5px]">
          Access pass
        </h1>
        <div className="flex border border-border rounded-full bg-surface p-[3px]">
          {(["active", "expired"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={
                mode === m
                  ? "border-0 bg-dark text-white rounded-full px-3 py-[5px] text-[11.5px]"
                  : "border-0 bg-transparent text-text-faint rounded-full px-3 py-[5px] text-[11.5px] hover:text-text"
              }
            >
              {m === "active" ? "Active" : "Expired"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 bg-surface border border-border rounded-2xl p-8 text-center shadow-[0_1px_3px_rgba(27,27,25,.05)]">
        {mode === "active" ? (
          <>
            <div className="inline-flex items-center gap-2 border border-accent-border bg-accent-bg text-accent rounded-full px-3 py-[5px] text-[11px] tracking-[.09em] font-mono">
              <span className="w-[6px] h-[6px] rounded-full bg-accent" />
              ACTIVE
            </div>
            <img
              src={placeholderQrDataUri()}
              alt="Access QR code"
              className="block mx-auto mt-[26px] w-[232px] h-[232px] border border-border-rule rounded-[10px] animate-pop"
            />
            <div className="mt-[18px] text-[13px] text-text-faint font-mono">
              Valid for {mm}:{ss}
            </div>
          </>
        ) : (
          <>
            <div className="inline-flex items-center gap-2 border border-border-rule bg-[#f6f6f3] text-text-faint rounded-full px-3 py-[5px] text-[11px] tracking-[.09em] font-mono">
              <span className="w-[6px] h-[6px] rounded-full bg-[#b4b4ac]" />
              EXPIRED
            </div>
            <img
              src={placeholderQrDataUri()}
              alt="Expired QR code"
              className="block mx-auto mt-[26px] w-[232px] h-[232px] border border-border-hairline rounded-[10px] grayscale opacity-[.24]"
            />
            <div className="mt-[18px] text-[13.5px] text-text-faint">
              This access pass is no longer valid.
            </div>
          </>
        )}

        <div className="mt-[26px] pt-6 border-t border-border-hairline text-left grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-[18px]">
          <div>
            <div className="text-[11px] tracking-[.06em] text-text-faint-2 font-mono">
              AMENITY
            </div>
            <div className="mt-[5px] text-sm font-medium">Emerald Meeting Room</div>
          </div>
          <div>
            <div className="text-[11px] tracking-[.06em] text-text-faint-2 font-mono">
              LOCATION
            </div>
            <div className="mt-[5px] text-sm font-medium">Tower A · Floor 8</div>
          </div>
          <div>
            <div className="text-[11px] tracking-[.06em] text-text-faint-2 font-mono">
              VALID
            </div>
            <div className="mt-[5px] text-sm font-medium">3:00 PM – 4:00 PM</div>
          </div>
          <div>
            <div className="text-[11px] tracking-[.06em] text-text-faint-2 font-mono">
              ATTENDEES
            </div>
            <div className="mt-[5px] text-sm font-medium">5</div>
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
