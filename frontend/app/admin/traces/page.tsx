"use client";

import { useEffect, useState } from "react";
import * as api from "@/lib/api-client";
import type { BackendMetrics, BackendTraceDetail, BackendTraceSummary } from "@/lib/backend-types";
import { StatusPill } from "@/components/ui/status-pill";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface border border-border rounded-2xl px-5 py-4">
      <div className="text-[11px] tracking-[.04em] uppercase text-text-disabled">{label}</div>
      <div className="mt-[6px] text-xl font-semibold tracking-[-0.3px] text-text-primary">{value}</div>
    </div>
  );
}

function fmt(n: number | null | undefined, digits = 0): string {
  if (n === null || n === undefined) return "—";
  return n.toFixed(digits);
}

function fmtPct(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return `${(n * 100).toFixed(0)}%`;
}

export default function AgentTracesPage() {
  const [metrics, setMetrics] = useState<BackendMetrics | null>(null);
  const [traces, setTraces] = useState<BackendTraceSummary[]>([]);
  const [selected, setSelected] = useState<BackendTraceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getMetrics(), api.getTraces(50)])
      .then(([m, t]) => {
        setMetrics(m);
        setTraces(t);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load traces."))
      .finally(() => setLoading(false));
  }, []);

  const openTrace = (id: string) => {
    setSelected(null);
    api.getTrace(id).then(setSelected).catch(() => {});
  };

  return (
    <section className="animate-rise">
      <h1 className="m-0 text-[26px] md:text-[28px] font-semibold tracking-[-0.6px]">Agent traces</h1>
      <p className="mt-2 text-[15px] text-text-muted">
        Per-turn observability for the AI agent — real tool calls, retrieval, tokens, and latency.
        No chain-of-thought is recorded or shown.
      </p>

      {error && (
        <div className="mt-5 border border-danger-border-tint bg-danger-tint rounded-2xl px-5 py-4 text-[13.5px] text-danger-dark">
          {error}
        </div>
      )}

      {loading && <div className="mt-6 text-sm text-text-disabled">Loading…</div>}

      {metrics && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total requests" value={String(metrics.total_requests)} />
          <StatCard label="Agent bookings" value={String(metrics.agent_bookings_created)} />
          <StatCard label="Paid / free" value={`${metrics.paid_agent_bookings} / ${metrics.free_agent_bookings}`} />
          <StatCard label="Error rate" value={fmtPct(metrics.error_rate)} />
          <StatCard label="Avg tool calls / req" value={fmt(metrics.average_tool_calls_per_request, 1)} />
          <StatCard label="Avg tokens in / out" value={`${fmt(metrics.average_input_tokens)} / ${fmt(metrics.average_output_tokens)}`} />
          <StatCard label="P50 / P95 latency" value={`${fmt(metrics.p50_latency_ms)} / ${fmt(metrics.p95_latency_ms)} ms`} />
          <StatCard label="Alt. recommendation rate" value={fmtPct(metrics.alternative_recommendation_rate)} />
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-5">
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border-hairline text-[11px] tracking-[.07em] font-mono text-text-faint-2">
            RECENT TURNS
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {traces.map((t) => (
              <button
                key={t.id}
                onClick={() => openTrace(t.id)}
                className={`w-full text-left px-5 py-3 border-b border-border-hairline-2 last:border-b-0 hover:bg-[#fcfcfa] ${
                  selected?.id === t.id ? "bg-[#fafaf8]" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <StatusPill tone={t.success ? "accent" : "danger"}>
                    {t.success ? "ok" : t.error_code ?? "error"}
                  </StatusPill>
                  <span className="text-[11px] text-text-faint-2 font-mono ml-auto">
                    {t.total_latency_ms}ms · {t.tool_call_count} calls
                  </span>
                </div>
                <div className="mt-[6px] text-[13.5px] text-text-primary truncate">{t.user_message}</div>
                <div className="mt-1 text-[12px] text-text-disabled truncate">{t.final_response}</div>
              </button>
            ))}
            {!loading && traces.length === 0 && (
              <div className="px-5 py-6 text-sm text-text-disabled">No traces yet — talk to the agent first.</div>
            )}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5">
          {!selected && <div className="text-sm text-text-disabled">Select a turn to inspect it.</div>}
          {selected && (
            <div className="text-[13.5px]">
              <div className="text-[11px] text-text-disabled">USER ({selected.user_id})</div>
              <div className="mt-1 text-text-primary">{selected.user_message}</div>

              <div className="mt-4 text-[11px] text-text-disabled">FINAL RESPONSE</div>
              <div className="mt-1 text-text-primary whitespace-pre-line">{selected.final_response}</div>

              <div className="mt-4 grid grid-cols-3 gap-3 text-[12.5px]">
                <div>
                  <div className="text-[11px] text-text-disabled">Model</div>
                  <div className="mt-[3px] font-mono text-[12px]">{selected.model}</div>
                </div>
                <div>
                  <div className="text-[11px] text-text-disabled">Tokens in/out</div>
                  <div className="mt-[3px]">{selected.input_tokens} / {selected.output_tokens}</div>
                </div>
                <div>
                  <div className="text-[11px] text-text-disabled">Latency</div>
                  <div className="mt-[3px]">{selected.total_latency_ms}ms</div>
                </div>
              </div>

              {selected.retrieval_query && (
                <div className="mt-4">
                  <div className="text-[11px] text-text-disabled">RETRIEVED POLICY CONTEXT</div>
                  <div className="mt-1 text-text-secondary">query: “{selected.retrieval_query}”</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(selected.retrieved_chunk_ids ?? []).map((c) => (
                      <span key={c} className="border border-border rounded-full px-2 py-[2px] text-[11px] font-mono text-text-secondary">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <div className="text-[11px] text-text-disabled mb-2">TOOL CALLS</div>
                <div className="border border-border-hairline rounded-xl overflow-hidden">
                  {selected.tool_calls.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-3 py-2 border-b border-border-hairline-2 last:border-b-0 text-[12.5px]"
                    >
                      <span className="font-mono">{c.tool_name}</span>
                      <span className="text-text-faint-2 ml-auto">{c.duration_ms}ms</span>
                      <StatusPill tone={c.result_status === "ok" ? "accent" : "danger"}>
                        {c.result_status === "ok" ? "ok" : c.error_code ?? "error"}
                      </StatusPill>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
