"use client";

import { useCallback, useState } from "react";
import { useAppState } from "./app-state";
import { getScenarioBase, scenarioTraces } from "./mock-data";
import type { ScenarioKey } from "./types";

export interface UIOption {
  name: string;
  detail: string;
  tag: string;
  pick: () => void;
}

export interface UIAction {
  label: string;
  kind: "primary" | "secondary";
  run: () => void;
}

export interface UITurn {
  user: string;
  agent: string;
  optionsTitle: string;
  options: UIOption[];
  actions: UIAction[];
  resultTitle: string | null;
  resultBody: string | null;
  blockTitle: string | null;
  blockBody: string | null;
  trace: string;
}

interface ScnState {
  unavailable: string | null;
  paid: "ask" | "confirmed" | "cancelled";
  low: "idle" | "sent";
  capacity: string | null;
}

const initialScn: ScnState = {
  unavailable: null,
  paid: "ask",
  low: "idle",
  capacity: null,
};

export function useAssistantScenario() {
  const { credits, spend } = useAppState();
  const [scenario, setScenario] = useState<ScenarioKey>("unavailable");
  const [scn, setScn] = useState<ScnState>(initialScn);

  const selectScenario = useCallback((key: ScenarioKey) => {
    setScenario(key);
    setScn(initialScn);
  }, []);

  const turn: UITurn = (() => {
    const base = getScenarioBase(scenario);
    const trace = scenarioTraces[scenario];

    if (scenario === "unavailable") {
      const booked = scn.unavailable;
      return {
        user: base.user,
        agent: booked
          ? `Emerald is unavailable at 3 PM. I booked the next valid slot instead.`
          : base.agent,
        optionsTitle: base.optionsTitle,
        options: booked
          ? []
          : base.options.map((o) => ({
              ...o,
              pick: () =>
                setScn((s) => ({ ...s, unavailable: `${o.name} · ${o.detail}` })),
            })),
        actions: [],
        resultTitle: booked ? base.resultTitle : null,
        resultBody: booked ? `${booked}\nBooking ID AMN-20482 · access pass issued.` : null,
        blockTitle: null,
        blockBody: null,
        trace,
      };
    }

    if (scenario === "paid") {
      const s = scn.paid;
      const agent =
        s === "ask"
          ? `The gym is available from 6:00–7:00 PM.\nThis booking costs 10 credits. You have ${credits} credits remaining.\nWould you like me to confirm?`
          : s === "confirmed"
            ? "The gym is booked for 6:00–7:00 PM."
            : "No problem — nothing was booked and no credits were used.";
      return {
        user: base.user,
        agent,
        optionsTitle: "",
        options: [],
        actions:
          s === "ask"
            ? [
                {
                  label: "Confirm booking",
                  kind: "primary",
                  run: () => {
                    spend(10, "Gym · Today 6:00 PM");
                    setScn((x) => ({ ...x, paid: "confirmed" }));
                  },
                },
                {
                  label: "Cancel",
                  kind: "secondary",
                  run: () => setScn((x) => ({ ...x, paid: "cancelled" })),
                },
              ]
            : [],
        resultTitle: s === "confirmed" ? base.resultTitle : null,
        resultBody:
          s === "confirmed"
            ? `10 credits deducted. ${credits} credits remaining.\nBooking ID AMN-20483 · access pass issued.`
            : null,
        blockTitle: null,
        blockBody: null,
        trace,
      };
    }

    if (scenario === "low") {
      const sent = scn.low === "sent";
      return {
        user: base.user,
        agent: base.agent,
        optionsTitle: "",
        options: [],
        actions: sent
          ? []
          : [
              {
                label: "Contact admin",
                kind: "primary",
                run: () => setScn((x) => ({ ...x, low: "sent" })),
              },
            ],
        resultTitle: sent ? base.resultTitle : null,
        resultBody: sent ? base.resultBody : null,
        blockTitle: sent ? null : base.blockTitle,
        blockBody: sent ? null : base.blockBody,
        trace,
      };
    }

    // capacity
    const booked = scn.capacity;
    return {
      user: base.user,
      agent: booked
        ? "Ruby Meeting Room has a capacity of 4. I moved your request to a larger room."
        : base.agent,
      optionsTitle: base.optionsTitle,
      options: booked
        ? []
        : base.options.map((o) => ({
            ...o,
            pick: () =>
              setScn((s) => ({
                ...s,
                capacity: `${o.name} · ${o.detail.replace("Floor 8 · ", "")} · 3:00–4:00 PM`,
              })),
          })),
      actions: [],
      resultTitle: booked ? base.resultTitle : null,
      resultBody: booked ? `${booked}\nBooking ID AMN-20484 · access pass issued.` : null,
      blockTitle: null,
      blockBody: null,
      trace,
    };
  })();

  return { scenario, selectScenario, turn };
}
