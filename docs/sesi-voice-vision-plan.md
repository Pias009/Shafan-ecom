# Sesi: Voice & Vision Enhancement Plan

## Overview
Add voice capabilities (talk) and screen awareness (see) to the Sesi AI skincare assistant.

## Current Architecture
- **AI Provider**: Groq (`llama-3.3-70b-versatile` via `groq-sdk`)
- **Input**: Text only (chat input field + quick reply buttons)
- **Output**: Text only (rendered as chat bubbles + GIFs)
- **State**: Zustand store in `useSesi.ts`
- **Key files**: `SesiChat.tsx`, `brain.ts`, `/api/sesi/chat/route.ts`

---

## Phase 1: Voice Input (Speech-to-Text)

### What
User taps a mic button, speaks, and their speech becomes the chat message.

### Implementation
1. **Add mic button** in `SesiChat.tsx` next to the text input
2. **Use Web Speech API** (`SpeechRecognition`) — built into Chrome, Edge, Safari — no API key needed
3. **States**: idle → listening → processing → send text to chat
4. **Fallback**: if `SpeechRecognition` unavailable, hide the mic button

### Files to modify
- `src/components/Sesi/SesiChat.tsx` — add mic UI + speech recognition logic

### Effort: ~half day

---

## Phase 2: Voice Output (Text-to-Speech)

### What
Sesi speaks her responses aloud using a natural voice.

### Options
| Option | Cost | Quality | Effort |
|--------|------|---------|--------|
| **Browser `SpeechSynthesis`** | Free | Robotic, varies by OS | 1 hour |
| **OpenAI TTS** | ~$0.015/1K chars | Very natural | 2 hours |
| **ElevenLabs** | ~$5/month (starter) | Best quality | 2 hours |

### Implementation
1. After receiving an AI response, call `SpeechSynthesis.speak()` or the TTS API
2. Add a speaker icon toggle to mute/unmute
3. Store preference in `useSesi.ts`

### Files to modify
- `src/components/Sesi/SesiChat.tsx` — add TTS call after message received
- `src/components/Sesi/useSesi.ts` — add `voiceEnabled` state

### Effort: ~half day (browser) / 1 day (premium)

---

## Phase 3: Screen Awareness (Vision)

### What
User shares their screen (or a portion), Sesi can see and discuss what's on screen (e.g., "what product is this?", "is my skin looking okay?")

### Implementation Flow
1. **User clicks "Share Screen" button** in the Sesi panel
2. **Browser prompt** for screen/window/tab selection via `getDisplayMedia()`
3. **Capture frames** periodically (every 2-3 seconds) using `<canvas>` snapshot from the screen capture stream
4. **Send latest frame** along with chat message as a base64 image to the AI
5. **Use a vision-capable model**: Groq offers `llama-3.2-90b-vision-preview` — same provider, no new API key needed
6. **Stop sharing** when user clicks stop or closes the panel

### Files to modify
- `src/components/Sesi/SesiChat.tsx` — add screen share button + stream handling
- `src/components/Sesi/useSesi.ts` — add `screenShareActive` state + captured frame
- `src/lib/sesi/brain.ts` — update system prompt + switch model for vision requests
- `src/app/api/sesi/chat/route.ts` — accept optional `image` field in request body

### Effort: ~2-3 days

---

## Phase 4: Polish & Production

### What
Make the feature production-ready.

### Tasks
- Add microphone permission handling (denied → show guidance)
- Add screen share permission handling + error states
- Store voice preference (on/off) in localStorage
- Add visual indicators: mic pulsing animation when listening, screen share badge
- Test across Chrome, Safari, Firefox
- Add timeout for speech recognition (auto-stop after 10s silence)

### Effort: ~1 day

---

## Summary

| Phase | Feature | Effort | Dependencies |
|-------|---------|--------|-------------|
| 1 | Voice input (mic → text) | ~4h | None (browser API) |
| 2 | Voice output (text → speech) | ~1-4h | None (browser API) or TTS API key |
| 3 | Screen awareness (vision) | ~2-3d | Groq vision model (already available) |
| 4 | Polish & production readiness | ~1d | Phases 1-3 complete |

**Total estimated effort: 4-7 days**

## Key Technical Notes
- Groq already supports vision models — no new provider needed
- Web Speech API (both recognition + synthesis) works in Chrome, Edge, Safari; limited in Firefox
- Screen sharing requires HTTPS (already on production)
- Vision requests will increase token usage (images are base64-encoded)
