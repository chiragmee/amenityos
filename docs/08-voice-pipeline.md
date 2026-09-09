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
local faster-whisper.

The STT implementation should be behind an interface:

```text
SpeechRecognizer
  -> transcribe(audio) -> text
```

This allows a cloud STT provider to be introduced later.

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
