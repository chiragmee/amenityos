"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/app-state";
import { stepLabels, useVoiceFlow } from "@/lib/use-voice-flow";
import { Waveform } from "@/components/home/waveform";
import { StepChecklist } from "@/components/home/step-checklist";
import { HomeBookingsPreview } from "@/components/home/home-bookings-preview";

const SUCCESS_PAUSE_MS = 1200;

export default function HomePage() {
  const router = useRouter();
  const { user, sendAgentMessage } = useAppState();
  const [reply, setReply] = useState("");
  const sessionIdRef = useRef<string | null>(null);

  const handleSend = useCallback(
    async (text: string) => {
      const result = await sendAgentMessage(sessionIdRef.current, text);
      sessionIdRef.current = result.sessionId;
      if (result.booking) {
        const bookingId = result.booking.id;
        setTimeout(() => router.push(`/pass/${bookingId}`), SUCCESS_PAUSE_MS);
      }
      return { message: result.message, booking: result.booking, options: result.options };
    },
    [sendAgentMessage, router]
  );

  const {
    voice,
    step,
    transcript,
    typed,
    setTyped,
    agentMessage,
    agentOptions,
    errorMessage,
    startVoice,
    stopVoice,
    resetVoice,
    sendTyped,
    sendReply,
  } = useVoiceFlow(handleSend);

  const vIdle = voice === "idle";
  const vListen = voice === "listening";
  const vTranscribing = voice === "transcribing";
  const vAfter = voice === "processing" || voice === "done" || voice === "needs-reply" || voice === "error";
  const vDone = voice === "done";
  const vNeedsReply = voice === "needs-reply";
  const vError = voice === "error";

  const handleAskAgain = () => {
    sessionIdRef.current = null;
    setReply("");
    resetVoice();
  };

  const handleSendReply = () => {
    if (!reply.trim()) return;
    sendReply(reply);
    setReply("");
  };

  return (
    <section className="animate-rise">
      <h1 className="m-0 text-[28px] md:text-[32px] font-semibold tracking-[-0.6px] text-text-primary">
        Good afternoon, {user?.name ?? ""}
      </h1>
      <p className="mt-2 text-base text-text-secondary">What do you need?</p>

      <div className="mt-6 bg-surface border border-border rounded-[24px] shadow-[0_2px_8px_rgba(34,38,43,0.06)] overflow-hidden">
        <div className="px-6 md:px-10 py-8 md:py-10 flex flex-col items-center text-center min-h-[220px] justify-center">
          {vIdle && (
            <div className="w-full max-w-[560px]">
              <div className="flex items-center gap-3 border border-border rounded-full bg-surface-subtle pl-5 pr-2 py-2 focus-within:border-brand transition-colors">
                <input
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && typed.trim()) sendTyped();
                  }}
                  placeholder="Tell nookly what you need"
                  className="flex-1 min-w-0 bg-transparent text-[15px] text-text-primary placeholder:text-text-disabled outline-none py-1"
                />
                {typed.trim() ? (
                  <button
                    onClick={sendTyped}
                    className="shrink-0 border-0 bg-brand text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-brand-dark transition-colors"
                    aria-label="Send"
                  >
                    →
                  </button>
                ) : (
                  <button
                    onClick={startVoice}
                    className="shrink-0 border-0 bg-transparent text-text-secondary rounded-full w-10 h-10 flex items-center justify-center hover:bg-border-subtle transition-colors"
                    aria-label="Speak instead"
                    title="Speak instead"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                      />
                      <path
                        d="M19 11v1a7 7 0 0 1-14 0v-1M12 19v3"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="text-[13px] text-text-disabled">
                  A quiet room, a desk, the gym — just say or type it.
                </div>
                <Link
                  href="/amenities"
                  className="shrink-0 border border-border bg-surface text-text-secondary rounded-full px-4 py-[7px] text-[12.5px] font-medium hover:border-text-disabled hover:text-text-primary transition-colors"
                >
                  Book Manually
                </Link>
              </div>
            </div>
          )}

          {vListen && (
            <button
              onClick={stopVoice}
              className="w-full flex flex-col items-center border-0 bg-transparent cursor-pointer"
              aria-label="Stop recording and send"
            >
              <Waveform />
              <div className="mt-5 text-[17px] font-medium tracking-[-0.2px] text-text-primary">
                Listening…
              </div>
              <div className="mt-1 text-[13px] text-text-disabled">tap to stop</div>
            </button>
          )}

          {vTranscribing && (
            <>
              <Waveform />
              <div className="mt-5 text-[17px] font-medium tracking-[-0.2px] text-text-primary">
                Transcribing…
              </div>
            </>
          )}

          {vAfter && (
            <div className="w-full max-w-[560px] text-left">
              <div className="text-[12px] text-text-disabled">You said</div>
              <div className="mt-1 text-lg font-medium tracking-[-0.2px] leading-[1.35] text-text-primary animate-rise">
                &ldquo;{transcript}&rdquo;
              </div>

              {!vError && (
                <div className="mt-5">
                  <StepChecklist labels={stepLabels} step={step} />
                </div>
              )}

              {vDone && (
                <div className="mt-5 flex items-center gap-3 animate-pop">
                  <span className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center text-sm">
                    ✓
                  </span>
                  <div className="text-lg font-semibold tracking-[-0.2px] text-text-primary">
                    {agentMessage ?? "You're booked."}
                  </div>
                </div>
              )}

              {vNeedsReply && (
                <div className="mt-5 border border-border bg-surface-subtle rounded-[16px] px-5 py-4 animate-rise">
                  <div className="text-[12px] text-text-disabled">nookly</div>
                  <div className="mt-1 text-[14.5px] text-text-primary leading-[1.55]">
                    {agentMessage}
                  </div>

                  {agentOptions && agentOptions.options.length > 0 && (
                    <div className="mt-3 flex flex-col gap-2">
                      {agentOptions.options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => sendReply(opt.value)}
                          className="text-left border border-border bg-surface rounded-[12px] px-4 py-[10px] hover:border-brand hover:bg-brand-tint transition-colors"
                        >
                          <div className="text-[14px] font-medium text-text-primary">{opt.label}</div>
                          {opt.detail && (
                            <div className="mt-[2px] text-[12px] text-text-disabled">{opt.detail}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-2">
                    <input
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && reply.trim()) handleSendReply();
                      }}
                      placeholder="Or reply to nookly"
                      className="flex-1 min-w-0 border border-border rounded-full bg-surface px-4 py-2 text-[14px] text-text-primary placeholder:text-text-disabled outline-none focus:border-brand"
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={!reply.trim()}
                      className="shrink-0 border-0 bg-brand text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-brand-dark transition-colors disabled:opacity-40"
                      aria-label="Send reply"
                    >
                      →
                    </button>
                    <button
                      onClick={startVoice}
                      className="shrink-0 border border-border bg-surface text-text-secondary rounded-full w-10 h-10 flex items-center justify-center hover:bg-border-subtle transition-colors"
                      aria-label="Speak your reply"
                      title="Speak your reply"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                        />
                        <path
                          d="M19 11v1a7 7 0 0 1-14 0v-1M12 19v3"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                  <button
                    onClick={handleAskAgain}
                    className="mt-3 border border-border bg-surface text-text-secondary rounded-full px-4 py-2 text-[12.5px] hover:border-text-disabled hover:text-text-primary"
                  >
                    Start over
                  </button>
                </div>
              )}

              {vError && (
                <div className="mt-5 border border-danger-border-tint bg-danger-tint rounded-[16px] px-5 py-4">
                  <div className="text-[14.5px] font-semibold text-danger-dark">
                    That didn&apos;t go through.
                  </div>
                  <div className="mt-1 text-[13.5px] text-danger-dark leading-[1.55]">
                    {errorMessage}
                  </div>
                  <button
                    onClick={handleAskAgain}
                    className="mt-3 border border-border bg-surface text-text-secondary rounded-full px-4 py-2 text-[12.5px] hover:border-text-disabled hover:text-text-primary"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <HomeBookingsPreview />
    </section>
  );
}
