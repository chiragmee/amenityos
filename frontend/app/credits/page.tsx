"use client";

import { useAppState } from "@/lib/app-state";

export default function CreditsPage() {
  const { user, credits, monthlyAllowance, spentThisMonth, ledger } = useAppState();
  const total = credits + spentThisMonth;
  const pct = total > 0 ? Math.round((credits / total) * 100) : 100;

  return (
    <section className="animate-rise">
      <h1 className="m-0 text-[26px] md:text-[28px] font-semibold tracking-[-0.6px]">
        Credits
      </h1>
      <p className="mt-2 text-[15px] text-text-muted">
        Balance and activity from your real credit ledger.
      </p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-[14px]">
        <div className="bg-surface border border-border rounded-xl p-[22px]">
          <div className="text-[11px] tracking-[.07em] font-mono text-text-faint-2">
            REMAINING
          </div>
          <div className="mt-[10px] text-[38px] font-semibold tracking-[-1.2px]">
            {credits}
          </div>
          <div className="mt-3 h-[5px] rounded-full bg-[#eeeee9] overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-[22px]">
          <div className="text-[11px] tracking-[.07em] font-mono text-text-faint-2">
            GRANTED THIS MONTH
          </div>
          <div className="mt-[10px] text-[38px] font-semibold tracking-[-1.2px]">
            {monthlyAllowance}
          </div>
          <div className="mt-3 text-[12.5px] text-text-faint">
            Granted by {user?.org ?? "your"} workplace plan
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-[22px]">
          <div className="text-[11px] tracking-[.07em] font-mono text-text-faint-2">
            SPENT THIS MONTH
          </div>
          <div className="mt-[10px] text-[38px] font-semibold tracking-[-1.2px]">
            {spentThisMonth}
          </div>
          <div className="mt-3 text-[12.5px] text-text-faint">
            From your real booking history
          </div>
        </div>
      </div>

      <h2 className="mt-9 text-[17px] font-semibold tracking-[-0.3px]">Activity</h2>
      <div className="mt-[14px] bg-surface border border-border rounded-xl overflow-hidden">
        {ledger.length === 0 && (
          <div className="px-5 py-6 text-sm text-text-faint">No activity yet.</div>
        )}
        {ledger.map((l) => (
          <div
            key={l.id}
            className="flex items-center gap-[14px] px-5 py-[15px] border-b border-border-hairline-2 last:border-b-0"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{l.name}</div>
              <div className="mt-[3px] text-xs text-text-faint-2 font-mono">
                {l.date}
              </div>
            </div>
            <div
              className={`text-sm font-medium font-mono ${
                l.amount < 0 ? "text-danger-dark" : "text-accent"
              }`}
            >
              {l.amount > 0 ? `+${l.amount}` : l.amount}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
