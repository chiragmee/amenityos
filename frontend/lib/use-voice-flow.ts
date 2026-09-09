"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceState = "idle" | "listening" | "processing" | "done";

const STEP_DURATION_MS = 620;
const DEFAULT_TRANSCRIPT =
  "Book Emerald Meeting Room today at 3 PM for five people.";

export const stepLabels = [
  "Understanding request…",
  "Checking Emerald availability…",
  "Checking booking rules…",
  "Booking Emerald…",
];

export function useVoiceFlow(onDone: () => void) {
  const [voice, setVoice] = useState<VoiceState>("idle");
  const [step, setStep] = useState(0);
  const [transcript, setTranscript] = useState(DEFAULT_TRANSCRIPT);
  const [typed, setTyped] = useState("");
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
      for (let i = 1; i <= 4; i++) {
        at(STEP_DURATION_MS * i, () => setStep(i));
      }
      at(STEP_DURATION_MS * 4 + 240, () => {
        setVoice("done");
        onDone();
      });
    },
    [at, clear, onDone]
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
  }, [clear]);

  const sendTyped = useCallback(() => {
    const t = typed.trim();
    run(t || DEFAULT_TRANSCRIPT);
  }, [typed, run]);

  return {
    voice,
    step,
    transcript,
    typed,
    setTyped,
    startVoice,
    resetVoice,
    sendTyped,
    run,
  };
}
