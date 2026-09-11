# 08 — Voice Pipeline

## MVP goal

Provide a voice-first interaction without introducing unnecessary realtime complexity.

## MVP architecture

```text
Microphone
   |
   v
Push-to-talk recording
   |
   v
Speech-to-text
   |
   v
Agent API
   |
   v
Final response text
   |
   v
Browser SpeechSynthesis
   |
   v
User
```

## Speech-to-text

MVP:
started with local faster-whisper, per the original plan below. Switched
to Gemini's audio understanding (2026-09-12) after measuring ~30s per
short clip on the deployed host's free-tier CPU (0.1 vCPU) — confirmed via
repeated live requests that it was consistent, correctly-transcribing,
CPU-bound slowness, not a cold-start or functional bug. Gemini transcribes
the same clips in ~1-3s and was more accurate on longer/harder phrases in
a head-to-head test. This is exactly the swap the interface below was
designed to allow.

The STT implementation lives behind an interface:

```text
SpeechRecognizer
  -> transcribe(audio) -> text
```

This allows the underlying provider to change (as it did) without
touching the router or the agent.

## VAD

MVP:
push-to-talk.

Reason:
- simplest interaction
- easiest debugging
- no streaming infrastructure
- fewer accidental submissions

Future:
Silero VAD or realtime audio API.

## TTS

MVP:
browser `SpeechSynthesis`.

Only the final user-facing response should be spoken.

Do not speak tool traces such as:
- "Calling check_availability"
- "Executing create_booking"

Instead, use concise UI status labels if desired.

## Voice UX states

```text
idle
listening
transcribing
thinking
executing
responding
success
error
```

## Error handling

If transcription fails:

> I couldn't understand that. Please try again.

If the agent cannot safely interpret the request:

> I need one more detail: what time would you like to book it?

## Future realtime architecture

```text
Microphone
   |
   v
VAD
   |
   v
Streaming audio
   |
   v
Realtime model
   |
   +--> tools
   |
   v
Streaming voice response
```

Do not implement realtime speech-to-speech until the non-realtime flow is reliable.
