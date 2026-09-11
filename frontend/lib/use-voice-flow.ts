"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, transcribeAudio } from "./api-client";

export type VoiceState =
  | "idle"
  | "listening"
  | "transcribing"
  | "processing"
  | "done"
  | "needs-reply"
  | "error";

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
 * Drives the full voice UX per docs/08-voice-pipeline.md: push-to-talk mic
 * capture (MediaRecorder) -> real STT (POST /voice/transcribe, local
 * faster-whisper) -> the same agent turn used by typed input -> browser
 * SpeechSynthesis speaking only the final response (never intermediate
 * tool-trace text, and only for turns that actually originated from voice).
 */
export function useVoiceFlow(onSend: (text: string) => Promise<AgentTurnResult>) {
  const [voice, setVoice] = useState<VoiceState>("idle");
  const [step, setStep] = useState(0);
  const [transcript, setTranscript] = useState(DEFAULT_TRANSCRIPT);
  const [typed, setTyped] = useState("");
  const [agentMessage, setAgentMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => clear, [clear]);

  const at = useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }, []);

  const sendToAgent = useCallback(
    (text: string, spoken: boolean) => {
      clear();
      setVoice("processing");
      setStep(0);
      setTranscript(text);
      setErrorMessage(null);
      setAgentMessage(null);
      // "Thinking" indicator while the real agent call is in flight — see
      // the Phase A note this replaces: holds at the last step until the
      // response actually arrives, since latency is variable.
      for (let i = 1; i <= 4; i++) {
        at(STEP_DURATION_MS * i, () => setStep(i));
      }
      onSend(text)
        .then((result) => {
          clear();
          setStep(4);
          setAgentMessage(result.message);
          setVoice(result.booking ? "done" : "needs-reply");
          if (spoken) speak(result.message);
        })
        .catch((err: unknown) => {
          clear();
          setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
          setVoice("error");
        });
    },
    [at, clear, onSend, speak]
  );

  const startVoice = useCallback(async () => {
    clear();
    setErrorMessage(null);
    setAgentMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stopStream();
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setVoice("transcribing");
        try {
          const text = await transcribeAudio(blob);
          sendToAgent(text, true);
        } catch (err) {
          setErrorMessage(
            err instanceof ApiError ? err.message : "I couldn't understand that. Please try again."
          );
          setVoice("error");
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setVoice("listening");
    } catch {
      setErrorMessage("Microphone access was denied or unavailable.");
      setVoice("error");
    }
  }, [clear, sendToAgent, stopStream]);

  const stopVoice = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
  }, []);

  const resetVoice = useCallback(() => {
    clear();
    stopStream();
    mediaRecorderRef.current = null;
    setVoice("idle");
    setStep(0);
    setTyped("");
    setAgentMessage(null);
    setErrorMessage(null);
  }, [clear, stopStream]);

  const sendTyped = useCallback(() => {
    const t = typed.trim();
    setTyped("");
    sendToAgent(t || DEFAULT_TRANSCRIPT, false);
  }, [typed, sendToAgent]);

  const sendReply = useCallback(
    (text: string) => {
      const t = text.trim();
      if (t) sendToAgent(t, false);
    },
    [sendToAgent]
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
    stopVoice,
    resetVoice,
    sendTyped,
    sendReply,
  };
}
