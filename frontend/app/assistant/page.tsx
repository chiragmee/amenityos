"use client";

import { scenarioLabels, useAssistantScenario } from "@/lib/use-assistant-scenario";
import { OptionsList } from "@/components/assistant/options-list";
import { ResultPanel, BlockPanel } from "@/components/assistant/result-panels";

export default function AssistantPage() {
  const { scenario, selectScenario, turn } = useAssistantScenario();

  return (
    <section className="animate-rise">
      <h1 className="m-0 text-[26px] md:text-[28px] font-semibold tracking-[-0.6px]">
        AI Assistant
      </h1>
      <p className="mt-2 text-[15px] text-text-muted">
        Every request is resolved against live availability, amenity rules,
        eligibility and credits.
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

      <div className="mt-5 bg-surface border border-border rounded-[14px] p-5 md:p-7 shadow-[0_1px_2px_rgba(27,27,25,.04)]">
        <div className="flex justify-end">
          <div className="max-w-[85%] sm:max-w-[70%] bg-dark text-white rounded-[12px_12px_3px_12px] px-4 py-[13px] text-[14.5px] leading-[1.45]">
            {turn.user}
          </div>
        </div>

        <div className="mt-[18px] flex gap-3 animate-rise">
          <div className="w-[26px] h-[26px] shrink-0 rounded-[7px] bg-accent text-white flex items-center justify-center text-[11px] font-semibold">
            A
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] leading-[1.55] whitespace-pre-line">
              {turn.agent}
            </div>

            {turn.options.length > 0 && (
              <OptionsList title={turn.optionsTitle} options={turn.options} />
            )}

            {turn.actions.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {turn.actions.map((a, i) =>
                  a.kind === "primary" ? (
                    <button
                      key={i}
                      onClick={a.run}
                      className="border-0 bg-accent text-white rounded-lg px-4 py-[10px] text-[13px] font-medium hover:bg-accent-dark"
                    >
                      {a.label}
                    </button>
                  ) : (
                    <button
                      key={i}
                      onClick={a.run}
                      className="border border-border bg-surface text-text-secondary-2 rounded-lg px-4 py-[10px] text-[13px] hover:border-[#c9c9c1]"
                    >
                      {a.label}
                    </button>
                  )
                )}
              </div>
            )}

            {turn.resultTitle && turn.resultBody && (
              <ResultPanel title={turn.resultTitle} body={turn.resultBody} />
            )}

            {turn.blockTitle && turn.blockBody && (
              <BlockPanel title={turn.blockTitle} body={turn.blockBody} />
            )}

            <div className="mt-4 text-[11.5px] text-[#a8a8a0] font-mono">
              {turn.trace}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
