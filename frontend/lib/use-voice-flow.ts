"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceState = "idle" | "listening" | "processing" | "done" | "needs-reply" | "error";

export interface AgentTurnResult {
  message: string;
  booking: unknown | null;
}

const STEP_DURATION_MS = 620;
const DEFAULT_TRANSCRIPT = "Book a meeting room for tomorrow.";

export const stepLabels = [
  "Understanding request…",
  "Checking availability…",
  "Checking booking rules…",
  "Talking to nookly…",
];

/**
 * Drives the listening/thinking animation and delegates the actual work to
 * `onSend`, which talks to the real agent (POST /agent/chat). The agent may
 * finish a booking outright, ask a clarifying/confirmation question (no
 * booking yet — "needs-reply"), or the call itself may fail ("error", e.g.
 * network/backend unreachable). Insufficient credits, capacity exceeded,
 * etc. are NOT JS errors — they come back as ordinary agent text with no
 * booking, so they land in "needs-reply" too.
 */
export function useVoiceFlow(onSend: (text: string) => Promise<AgentTurnResult>) {
  const [voice, setVoice] = useState<VoiceState>("idle");
  const [step, setStep] = useState(0);
  const [transcript, setTranscript] = useState(DEFAULT_TRANSCRIPT);
  const [typed, setTyped] = useState("");
  const [agentMessage, setAgentMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => clear, [clear]);

  const at = useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const run = useCallback(
    (text: string) => {
      clear();
      setVoice("processing");
      setStep(0);
      setTranscript(text);
      setErrorMessage(null);
      setAgentMessage(null);
      // Advances a "thinking" indicator while the real request is in
      // flight; holds at the last step until the response actually
      // arrives, since a real agent call has variable latency.
      for (let i = 1; i <= 4; i++) {
        at(STEP_DURATION_MS * i, () => setStep(i));
      }
      onSend(text)
        .then((result) => {
          clear();
          setStep(4);
          setAgentMessage(result.message);
          setVoice(result.booking ? "done" : "needs-reply");
        })
        .catch((err: unknown) => {
          clear();
          setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
          setVoice("error");
        });
    },
    [at, clear, onSend]
  );

  const startVoice = useCallback(() => {
    clear();
    setVoice("listening");
    setStep(0);
    at(1500, () => run(DEFAULT_TRANSCRIPT));
  }, [at, clear, run]);

  const resetVoice = useCallback(() => {
    clear();
    setVoice("idle");
    setStep(0);
    setTyped("");
    setAgentMessage(null);
    setErrorMessage(null);
  }, [clear]);

  const sendTyped = useCallback(() => {
    const t = typed.trim();
    setTyped("");
    run(t || DEFAULT_TRANSCRIPT);
  }, [typed, run]);

  const sendReply = useCallback(
    (text: string) => {
      const t = text.trim();
      if (t) run(t);
    },
    [run]
  );

  return {
    voice,
    step,
    transcript,
    typed,
    setTyped,
    agentMessage,
    errorMessage,
    startVoice,
    resetVoice,
    sendTyped,
    sendReply,
    run,
  };
}
