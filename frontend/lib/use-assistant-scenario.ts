"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CURRENT_USER_ID } from "./api-client";
import { useAppState } from "./app-state";
import type { BackendAgentOptionsBlock } from "./backend-types";
import type { Booking, ScenarioKey } from "./types";

export interface ChatTurn {
  role: "user" | "agent";
  text: string;
  options?: BackendAgentOptionsBlock | null;
}

interface ScenarioDef {
  key: ScenarioKey;
  label: string;
  userId: string;
  opener: string;
  note?: string;
}

/** Openers reuse the exact wording verified against the live agent for each
 * golden scenario in docs/19 — same sentences, real backend, real model. */
const SCENARIOS: ScenarioDef[] = [
  {
    key: "unavailable",
    label: "Slot unavailable",
    userId: CURRENT_USER_ID,
    opener: "Book Emerald Meeting Room for tomorrow from 3pm to 4pm.",
  },
  {
    key: "paid",
    label: "Paid amenity",
    userId: CURRENT_USER_ID,
    opener: "Book the gym for tomorrow at 6pm.",
  },
  {
    key: "low",
    label: "Insufficient credits",
    userId: "usr_rahul",
    opener: "Book the gym for tomorrow at 7am.",
    note: "Demo user: Rahul (low credit balance)",
  },
  {
    key: "capacity",
    label: "Capacity exceeded",
    userId: CURRENT_USER_ID,
    opener: "Book Ruby Meeting Room for tomorrow at 10am for 8 people.",
  },
];

export const scenarioLabels: { key: ScenarioKey; label: string }[] = SCENARIOS.map((s) => ({
  key: s.key,
  label: s.label,
}));

export function useAssistantScenario() {
  const { sendAgentMessage } = useAppState();
  const [scenario, setScenario] = useState<ScenarioKey>(SCENARIOS[0].key);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [reply, setReply] = useState("");
  const sessionIdRef = useRef<string | null>(null);
  const userIdRef = useRef<string>(CURRENT_USER_ID);

  const send = useCallback(
    async (userId: string, text: string) => {
      setTurns((t) => [...t, { role: "user", text }]);
      setLoading(true);
      setError(null);
      try {
        const result = await sendAgentMessage(sessionIdRef.current, text, userId);
        sessionIdRef.current = result.sessionId;
        setTurns((t) => [...t, { role: "agent", text: result.message, options: result.options }]);
        if (result.booking) setBooking(result.booking);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    },
    [sendAgentMessage]
  );

  const selectScenario = useCallback(
    (key: ScenarioKey) => {
      const def = SCENARIOS.find((s) => s.key === key)!;
      setScenario(key);
      setTurns([]);
      setBooking(null);
      setError(null);
      setReply("");
      sessionIdRef.current = null;
      userIdRef.current = def.userId;
      send(def.userId, def.opener);
    },
    [send]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    selectScenario(SCENARIOS[0].key);
  }, []);

  const sendReply = useCallback(() => {
    const t = reply.trim();
    if (!t || loading) return;
    setReply("");
    send(userIdRef.current, t);
  }, [reply, loading, send]);

  const sendOption = useCallback(
    (value: string) => {
      if (loading) return;
      send(userIdRef.current, value);
    },
    [loading, send]
  );

  const currentNote = SCENARIOS.find((s) => s.key === scenario)?.note ?? null;

  return {
    scenario,
    selectScenario,
    turns,
    loading,
    error,
    booking,
    reply,
    setReply,
    sendReply,
    sendOption,
    note: currentNote,
  };
}
