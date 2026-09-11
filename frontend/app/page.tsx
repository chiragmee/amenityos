"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAppState } from "@/lib/app-state";
import { stepLabels, useVoiceFlow } from "@/lib/use-voice-flow";
import { Waveform } from "@/components/home/waveform";
import { StepChecklist } from "@/components/home/step-checklist";
import { BookingConfirmCard } from "@/components/home/booking-confirm-card";
import { UpcomingBookingCard } from "@/components/home/upcoming-booking-card";
import type { Booking } from "@/lib/types";

const DEMO_AMENITY_ID = "amenity_emerald";
const DEMO_HOUR = 15; // 3 PM
const DEMO_DURATION_MINUTES = 60;
const DEMO_ATTENDEES = 5;

/** Next occurrence of `hour` at least 5 minutes out, so the canned demo
 * request never lands in the past regardless of when it's run. */
function nextSlot(hour: number): Date {
  const now = new Date();
  const candidate = new Date(now);
  candidate.setHours(hour, 0, 0, 0);
  if (candidate.getTime() <= now.getTime() + 5 * 60 * 1000) {
    candidate.setDate(candidate.getDate() + 1);
  }
  return candidate;
}

export default function HomePage() {
  const { user, upcomingBookings, createRealBooking, pendingPrefill, setPendingPrefill } =
    useAppState();
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const slotRef = useRef<Date | null>(null);

  const handleDone = useCallback(async () => {
    const slot = slotRef.current ?? nextSlot(DEMO_HOUR);
    const booking = await createRealBooking({
      amenityId: DEMO_AMENITY_ID,
      startTime: slot,
      durationMinutes: DEMO_DURATION_MINUTES,
      attendeeCount: DEMO_ATTENDEES,
    });
    setConfirmedBooking(booking);
  }, [createRealBooking]);

  const {
    voice,
    step,
    transcript,
    typed,
    setTyped,
    errorMessage,
    startVoice,
    resetVoice,
    sendTyped,
  } = useVoiceFlow(handleDone);

  useEffect(() => {
    if (pendingPrefill) {
      setTyped(pendingPrefill);
      setPendingPrefill(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPrefill]);

  const vIdle = voice === "idle";
  const vListen = voice === "listening";
  const vAfter = voice === "processing" || voice === "done" || voice === "error";
  const vDone = voice === "done";
  const vError = voice === "error";

  const handleAskAgain = () => {
    slotRef.current = null;
    resetVoice();
    setConfirmedBooking(null);
  };

  const handleStartVoice = () => {
    slotRef.current = nextSlot(DEMO_HOUR);
    startVoice();
  };

  const handleSendTyped = () => {
    // No NLU yet — whatever's typed is echoed as "what you said", but the
    // real request created is always this fixed demo slot.
    slotRef.current = nextSlot(DEMO_HOUR);
    sendTyped();
  };

  return (
    <section className="animate-rise">
      <h1 className="m-0 text-[28px] md:text-[32px] font-semibold tracking-[-0.7px]">
        Good afternoon, {user?.name ?? ""}
      </h1>
      <p className="mt-2 text-base text-text-muted">
        What would you like to book today?
      </p>

      <div className="mt-[30px] bg-surface border border-border rounded-[14px] shadow-[0_1px_2px_rgba(27,27,25,.04)] overflow-hidden">
        <div className="px-6 md:px-10 pt-10 md:pt-[52px] pb-10 flex flex-col items-center text-center min-h-[280px] md:min-h-[330px] justify-center">
          {vIdle && (
            <>
              <div className="relative flex items-center justify-center">
                <div className="absolute w-[88px] h-[88px] md:w-[104px] md:h-[104px] rounded-full border border-accent-border animate-pulse-ring" />
                <button
                  onClick={handleStartVoice}
                  className="relative w-[88px] h-[88px] md:w-[104px] md:h-[104px] rounded-full border border-accent bg-accent text-white cursor-pointer flex flex-col items-center justify-center gap-[6px] shadow-[0_6px_18px_rgba(15,92,82,.22)] transition-[transform,box-shadow] hover:-translate-y-[2px] hover:shadow-[0_10px_26px_rgba(15,92,82,.28)] active:scale-[.97]"
                >
                  <span className="text-[22px] leading-none">◉</span>
                  <span className="text-[11px] tracking-[.06em] font-mono">
                    HOLD
                  </span>
                </button>
              </div>
              <div className="mt-[22px] text-[17px] md:text-[19px] font-medium tracking-[-0.2px]">
                Hold to speak
              </div>
              <div className="mt-[6px] text-[13.5px] text-text-faint">
                Just ask. We&apos;ll handle the booking.
              </div>
            </>
          )}

          {vListen && (
            <>
              <Waveform />
              <div className="mt-[22px] text-[19px] font-medium tracking-[-0.2px]">
                Listening…
              </div>
              <div className="mt-[6px] text-[13.5px] text-text-faint font-mono">
                release to send
              </div>
            </>
          )}

          {vAfter && (
            <div className="w-full max-w-[620px] text-left">
              <div className="text-[11px] tracking-[.08em] text-text-faint-2 font-mono">
                YOU SAID
              </div>
              <div className="mt-2 text-lg md:text-[22px] font-medium tracking-[-0.3px] leading-[1.35] animate-rise">
                &ldquo;{transcript}&rdquo;
              </div>

              {!vError && (
                <div className="mt-[26px]">
                  <StepChecklist labels={stepLabels} step={step} />
                </div>
              )}

              {vDone && (
                <div className="mt-[22px] flex items-center gap-3 animate-pop">
                  <span className="w-[30px] h-[30px] rounded-full bg-accent text-white flex items-center justify-center text-sm">
                    ✓
                  </span>
                  <div className="text-lg md:text-xl font-semibold tracking-[-0.3px]">
                    Your booking is confirmed.
                  </div>
                  <div className="flex-1" />
                  <button
                    onClick={handleAskAgain}
                    className="border border-border bg-surface text-text-muted-2 rounded-lg px-3 py-2 text-[12.5px] hover:border-[#c9c9c1] hover:text-text"
                  >
                    Ask again
                  </button>
                </div>
              )}

              {vError && (
                <div className="mt-[22px] border border-danger-border bg-danger-bg-2 rounded-[10px] px-[18px] py-4">
                  <div className="text-[14.5px] font-semibold text-danger-dark">
                    Your booking couldn&apos;t be completed.
                  </div>
                  <div className="mt-[6px] text-[13.5px] text-danger-body leading-[1.55]">
                    {errorMessage}
                  </div>
                  <button
                    onClick={handleAskAgain}
                    className="mt-3 border border-border bg-surface text-text-muted-2 rounded-lg px-3 py-2 text-[12.5px] hover:border-[#c9c9c1] hover:text-text"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-border-hairline bg-[#fafaf8] px-[18px] py-[14px] flex items-center gap-[10px]">
          <span className="text-[12.5px] text-text-faint-2 whitespace-nowrap hidden sm:inline">
            Or type your request…
          </span>
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendTyped();
            }}
            placeholder="Book Sapphire tomorrow at 10 AM for 8 people"
            className="flex-1 min-w-0 border border-border rounded-lg px-3 py-[10px] text-[13.5px] bg-surface text-text outline-none focus:border-accent"
          />
          <button
            onClick={handleSendTyped}
            className="border-0 bg-dark text-white rounded-lg px-4 py-[10px] text-[13px] font-medium hover:bg-accent"
          >
            Send
          </button>
        </div>
      </div>

      {vDone && confirmedBooking && (
        <BookingConfirmCard booking={confirmedBooking} onAskAgain={handleAskAgain} />
      )}

      <div className="mt-11 flex items-baseline gap-3">
        <h2 className="m-0 text-[17px] font-semibold tracking-[-0.3px]">
          Upcoming bookings
        </h2>
        <Link href="/bookings" className="text-[12.5px] text-accent">
          View all
        </Link>
      </div>
      <div className="mt-[14px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[14px]">
        {upcomingBookings.length === 0 && (
          <div className="text-sm text-text-faint">No upcoming bookings yet.</div>
        )}
        {upcomingBookings.slice(0, 3).map((b) => (
          <UpcomingBookingCard key={b.id} booking={b} />
        ))}
      </div>
    </section>
  );
}
