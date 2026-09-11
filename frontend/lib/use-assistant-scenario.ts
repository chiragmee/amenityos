"use client";

import { useCallback, useEffect, useState } from "react";
import * as api from "./api-client";
import { useAppState } from "./app-state";
import { toBackendIso } from "./backend-time";
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

type Outcome =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; title: string; body: string }
  | { kind: "error"; title: string; body: string };

export const scenarioLabels: { key: ScenarioKey; label: string }[] = [
  { key: "unavailable", label: "Slot unavailable" },
  { key: "paid", label: "Paid amenity" },
  { key: "low", label: "Insufficient credits" },
  { key: "capacity", label: "Capacity exceeded" },
];

const TRACES: Record<ScenarioKey, string> = {
  unavailable: "live availability checked · real conflict detection",
  paid: "eligibility + credit balance checked against the real ledger",
  low: "real credit check against a low-balance demo user (Rahul)",
  capacity: "real capacity rule enforced by the backend",
};

/** Next occurrence of `hour` at least 5 minutes out. */
function nextSlot(hour: number): Date {
  const now = new Date();
  const candidate = new Date(now);
  candidate.setHours(hour, 0, 0, 0);
  if (candidate.getTime() <= now.getTime() + 5 * 60 * 1000) {
    candidate.setDate(candidate.getDate() + 1);
  }
  return candidate;
}

function errorMessage(err: unknown): string {
  return err instanceof api.ApiError ? err.message : "Something went wrong.";
}

export function useAssistantScenario() {
  const { createRealBooking } = useAppState();
  const [scenario, setScenario] = useState<ScenarioKey>("unavailable");

  const [unavailableOutcome, setUnavailableOutcome] = useState<Outcome>({ kind: "idle" });
  const [paidState, setPaidState] = useState<"ask" | "cancelled">("ask");
  const [paidOutcome, setPaidOutcome] = useState<Outcome>({ kind: "idle" });
  const [capacityOutcome, setCapacityOutcome] = useState<Outcome>({ kind: "idle" });

  const [lowResult, setLowResult] = useState<api.ApiError | { balance: number } | "loading" | null>(
    null
  );
  const [lowSent, setLowSent] = useState(false);

  const selectScenario = useCallback((key: ScenarioKey) => {
    setScenario(key);
    setUnavailableOutcome({ kind: "idle" });
    setPaidState("ask");
    setPaidOutcome({ kind: "idle" });
    setCapacityOutcome({ kind: "idle" });
    setLowResult(null);
    setLowSent(false);
  }, []);

  // "Insufficient credits" is real, but only true for the low-balance demo
  // user (Rahul) — fetch that real check once when the scenario is opened.
  useEffect(() => {
    if (scenario !== "low" || lowResult !== null) return;
    setLowResult("loading");
    api
      .validateBooking({
        user_id: "usr_rahul",
        amenity_id: "amenity_gym",
        start_time: toBackendIso(nextSlot(18)),
        duration_minutes: 60,
        attendee_count: 1,
      })
      .then((r) => setLowResult({ balance: r.current_balance }))
      .catch((err) => setLowResult(err instanceof api.ApiError ? err : new api.ApiError("UNKNOWN", errorMessage(err), 0)));
  }, [scenario, lowResult]);

  const bookUnavailableOption = useCallback(
    async (amenityId: string, hour: number, label: string) => {
      setUnavailableOutcome({ kind: "loading" });
      try {
        const booking = await createRealBooking({
          amenityId,
          startTime: nextSlot(hour),
          durationMinutes: 60,
          attendeeCount: 2,
        });
        setUnavailableOutcome({
          kind: "success",
          title: "Booking confirmed.",
          body: `${label}\nBooking ID ${booking.displayId} · access pass issued.`,
        });
      } catch (err) {
        setUnavailableOutcome({ kind: "error", title: "Booking failed", body: errorMessage(err) });
      }
    },
    [createRealBooking]
  );

  const confirmPaidBooking = useCallback(async () => {
    setPaidOutcome({ kind: "loading" });
    try {
      const booking = await createRealBooking({
        amenityId: "amenity_gym",
        startTime: nextSlot(18),
        durationMinutes: 60,
        attendeeCount: 1,
      });
      setPaidOutcome({
        kind: "success",
        title: "Booking confirmed.",
        body: `${booking.costCredits} credits deducted.\nBooking ID ${booking.displayId} · access pass issued.`,
      });
    } catch (err) {
      setPaidOutcome({ kind: "error", title: "Booking failed", body: errorMessage(err) });
    }
  }, [createRealBooking]);

  const bookCapacityOption = useCallback(
    async (amenityId: string, label: string, attendeeCount: number) => {
      setCapacityOutcome({ kind: "loading" });
      try {
        const booking = await createRealBooking({
          amenityId,
          startTime: nextSlot(15),
          durationMinutes: 60,
          attendeeCount,
        });
        setCapacityOutcome({
          kind: "success",
          title: "Booking confirmed.",
          body: `${label}\nBooking ID ${booking.displayId} · access pass issued.`,
        });
      } catch (err) {
        setCapacityOutcome({ kind: "error", title: "Couldn't book that room", body: errorMessage(err) });
      }
    },
    [createRealBooking]
  );

  const turn: UITurn = (() => {
    const trace = TRACES[scenario];

    if (scenario === "unavailable") {
      const outcome = unavailableOutcome;
      const options = [
        { name: "Emerald", detail: "4:00–5:00 PM", tag: "AVAILABLE", target: ["amenity_emerald", 16] as const },
        { name: "Emerald", detail: "2:00–3:00 PM", tag: "AVAILABLE", target: ["amenity_emerald", 14] as const },
        { name: "Sapphire", detail: "3:00–4:00 PM", tag: "AVAILABLE", target: ["amenity_sapphire", 15] as const },
      ];
      return {
        user: "Book Emerald at 3 PM for one hour.",
        agent:
          outcome.kind === "success"
            ? "Emerald was unavailable at 3 PM. I booked the next valid slot instead."
            : "Emerald is unavailable at 3 PM.",
        optionsTitle: "VALID ALTERNATIVES",
        options:
          outcome.kind === "success" || outcome.kind === "loading"
            ? []
            : options.map((o) => ({
                name: o.name,
                detail: o.detail,
                tag: o.tag,
                pick: () => bookUnavailableOption(o.target[0], o.target[1], `${o.name} · ${o.detail}`),
              })),
        actions: [],
        resultTitle: outcome.kind === "success" ? outcome.title : null,
        resultBody: outcome.kind === "success" ? outcome.body : null,
        blockTitle: outcome.kind === "error" ? outcome.title : null,
        blockBody: outcome.kind === "error" ? outcome.body : null,
        trace,
      };
    }

    if (scenario === "paid") {
      const outcome = paidOutcome;
      const agent =
        paidState === "cancelled"
          ? "No problem — nothing was booked and no credits were used."
          : outcome.kind === "success"
            ? "The gym is booked for 6:00–7:00 PM."
            : "The gym is available from 6:00–7:00 PM.\nThis booking costs 10 credits.\nWould you like me to confirm?";
      return {
        user: "Book the gym at 6 PM.",
        agent,
        optionsTitle: "",
        options: [],
        actions:
          paidState === "ask" && outcome.kind !== "success"
            ? [
                {
                  label: outcome.kind === "loading" ? "Confirming…" : "Confirm booking",
                  kind: "primary",
                  run: confirmPaidBooking,
                },
                { label: "Cancel", kind: "secondary", run: () => setPaidState("cancelled") },
              ]
            : [],
        resultTitle: outcome.kind === "success" ? outcome.title : null,
        resultBody: outcome.kind === "success" ? outcome.body : null,
        blockTitle: outcome.kind === "error" ? outcome.title : null,
        blockBody: outcome.kind === "error" ? outcome.body : null,
        trace,
      };
    }

    if (scenario === "low") {
      const isError = lowResult instanceof api.ApiError;
      const balance = isError ? undefined : (lowResult as { balance: number } | null)?.balance;
      return {
        user: "Book the gym at 6 PM. (as Rahul, a demo user with a low balance)",
        agent:
          lowResult === "loading" || lowResult === null
            ? "Checking your credit balance…"
            : isError
              ? lowResult.message
              : "The gym costs 10 credits — that request would go through.",
        optionsTitle: "",
        options: [],
        actions:
          isError && !lowSent
            ? [{ label: "Contact admin", kind: "primary", run: () => setLowSent(true) }]
            : [],
        resultTitle: lowSent ? "Request sent to workplace admin." : null,
        resultBody: lowSent
          ? "An admin will review this credit top-up request. You will be notified in nookly. (This is a UI placeholder — there's no backend endpoint for admin notifications yet.)"
          : null,
        blockTitle: isError && !lowSent ? "This booking cannot be completed." : null,
        blockBody:
          isError && !lowSent
            ? `${lowResult.message}${balance !== undefined ? ` (balance: ${balance})` : ""}`
            : null,
        trace,
      };
    }

    // capacity
    const outcome = capacityOutcome;
    return {
      user: "Book the Ruby meeting room for 8 people.",
      agent:
        outcome.kind === "success"
          ? "Ruby Meeting Room has a capacity of 4. I moved your request to a larger room."
          : "Ruby Meeting Room has a capacity of 4.\nI can check larger rooms at the same time.",
      optionsTitle: "ROOMS THAT FIT 8",
      options:
        outcome.kind === "success" || outcome.kind === "loading"
          ? []
          : [
              {
                name: "Emerald",
                detail: "Floor 8 · capacity 6",
                tag: "TOO SMALL BY 2",
                pick: () => bookCapacityOption("amenity_emerald", "Emerald · capacity 6", 8),
              },
              {
                name: "Sapphire",
                detail: "Floor 8 · capacity 10",
                tag: "FITS 8",
                pick: () => bookCapacityOption("amenity_sapphire", "Sapphire · capacity 10", 8),
              },
            ],
      actions: [],
      resultTitle: outcome.kind === "success" ? outcome.title : null,
      resultBody: outcome.kind === "success" ? outcome.body : null,
      blockTitle: outcome.kind === "error" ? outcome.title : null,
      blockBody: outcome.kind === "error" ? outcome.body : null,
      trace,
    };
  })();

  return { scenario, selectScenario, turn };
}
