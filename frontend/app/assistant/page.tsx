"use client";

import { scenarioLabels, useAssistantScenario } from "@/lib/use-assistant-scenario";
import { BookingConfirmCard } from "@/components/home/booking-confirm-card";

export default function AssistantPage() {
  const {
    scenario,
    selectScenario,
    turns,
    loading,
    error,
    booking,
    reply,
    setReply,
    sendReply,
    note,
  } = useAssistantScenario();

  return (
    <section className="animate-rise">
      <h1 className="m-0 text-[26px] md:text-[28px] font-semibold tracking-[-0.6px]">
        AI Assistant
      </h1>
      <p className="mt-2 text-[15px] text-text-muted">
        Every request goes to the real agent — resolved against live availability,
        amenity rules, eligibility and credits.
      </p>

      <div className="mt-[22px] flex flex-wrap gap-2">
        {scenarioLabels.map((s) => (
          <button
            key={s.key}
            onClick={() => selectScenario(s.key)}
            className={
              scenario === s.key
                ? "border border-accent bg-accent text-white rounded-full px-[14px] py-2 text-[12.5px] font-medium"
                : "border border-border bg-surface text-text-muted-2 rounded-full px-[14px] py-2 text-[12.5px] hover:border-[#c9c9c1] hover:text-text"
            }
          >
            {s.label}
          </button>
        ))}
      </div>

      {note && <div className="mt-2 text-[12px] text-text-disabled">{note}</div>}

      <div className="mt-5 bg-surface border border-border rounded-[24px] p-5 md:p-7 shadow-[0_2px_8px_rgba(34,38,43,0.06)]">
        <div className="flex flex-col gap-4">
          {turns.map((turn, i) =>
            turn.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] sm:max-w-[70%] bg-dark text-white rounded-[12px_12px_3px_12px] px-4 py-[13px] text-[14.5px] leading-[1.45]">
                  {turn.text}
                </div>
              </div>
            ) : (
              <div key={i} className="flex gap-3 animate-rise">
                <div className="w-[26px] h-[26px] shrink-0 rounded-[10px] bg-brand text-white flex items-center justify-center text-[11px] font-semibold">
                  A
                </div>
                <div className="min-w-0 flex-1 text-[15px] leading-[1.55] whitespace-pre-line pt-[3px]">
                  {turn.text}
                </div>
              </div>
            )
          )}

          {loading && (
            <div className="flex gap-3">
              <div className="w-[26px] h-[26px] shrink-0 rounded-[10px] bg-brand text-white flex items-center justify-center text-[11px] font-semibold">
                A
              </div>
              <div className="pt-[6px] text-[13.5px] text-text-disabled">Thinking…</div>
            </div>
          )}

          {error && (
            <div className="border border-danger-border-tint bg-danger-tint rounded-[16px] px-5 py-4">
              <div className="text-[14.5px] font-semibold text-danger-dark">
                That didn&apos;t go through.
              </div>
              <div className="mt-1 text-[13.5px] text-danger-dark leading-[1.55]">{error}</div>
            </div>
          )}
        </div>

        {!booking && (
          <div className="mt-5 flex items-center gap-2 border-t border-border-subtle pt-4">
            <input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && reply.trim() && !loading) sendReply();
              }}
              disabled={loading}
              placeholder="Reply to nookly"
              className="flex-1 min-w-0 border border-border rounded-full bg-surface-subtle px-4 py-2 text-[14px] text-text-primary placeholder:text-text-disabled outline-none focus:border-brand disabled:opacity-60"
            />
            <button
              onClick={sendReply}
              disabled={!reply.trim() || loading}
              className="shrink-0 border-0 bg-brand text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-brand-dark transition-colors disabled:opacity-40"
              aria-label="Send reply"
            >
              →
            </button>
          </div>
        )}
      </div>

      {booking && (
        <BookingConfirmCard booking={booking} onAskAgain={() => selectScenario(scenario)} />
      )}
    </section>
  );
}
