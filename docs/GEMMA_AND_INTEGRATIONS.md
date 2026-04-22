# Gemma 4 and integrations — wiring plan

This document matches the **canonical implementation-status table** in the repository [README.md](../README.md). If any other write-up disagrees, **README + this file + [ARCHITECTURE.md](./ARCHITECTURE.md)** win.

---

## What is real today

### Browser capability layer (no Ollama required)

| Capability | How it works |
|------------|--------------|
| **Microphone** | `audioCaptureService` — `getUserMedia({ audio })` + `AnalyserNode` RMS level. |
| **Speech-to-text** | `speechRecognitionService` — Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`). Unsupported browsers → **Type instead** sheet. |
| **Text-to-speech** | `speechSynthesisService` — `window.speechSynthesis` with language-matched voice selection. |
| **Camera** | `cameraService` — `getUserMedia({ video })` preview + frame capture into `SessionContext.pendingImage` as a data URL. |
| **Permissions** | `permissionsService` — `navigator.permissions` + `getUserMedia` with clear denied / unavailable handling. |

You can verify mic → interim transcript → typed fallback without running Ollama. Full “clear phrase + TTS readback + routing log line” requires Ollama (below).

### Interpretation (requires local Ollama)

| Capability | File | Behavior |
|------------|------|----------|
| **Gemma via Ollama** | `src/services/interpretation/GemmaInterpreterAdapter.ts` | `POST http://localhost:11434/api/generate` with `stream: true`, optional `images[]` from camera, JSON response mapping to `InterpretationResult`, client-side `applyUrgencyGuard`. On failure / non-OK / network error → **`GemmaNotConnectedError`** (honest; no fake text). |
| **Model tag names** | Settings → **Models** | `localStorage` keys `relay.model.fast`, `relay.model.finetuned`, `relay.model.quality` (defaults `gemma4:e2b`, `gemma4:e4b`, `gemma4:27b`). |

### Emergency (optional proxy)

| Capability | File | Behavior |
|------------|------|----------|
| **Emergency dispatch** | `src/services/emergency.ts` | When `relay.emergency.proxyUrl` and caregiver phone are set, `POST`s JSON to your proxy. Otherwise **`EmergencyNotConnectedError`**. |

---

## What is still stubbed

| Capability | File | Current behavior |
|------------|------|------------------|
| **Twilio test SMS** | `src/services/twilio.ts` | Throws `TwilioNotConnectedError`. |
| **SmartThings** | `src/services/smartthings.ts` | Throws `SmartThingsNotConnectedError`. |

No stub returns a fake “success” — the UI shows the error string from these throws.

---

## The single interpretation entry point

Every input surface (mic → STT, typed, quick phrases, symbols, camera-attached frame) calls:

```ts
import { interpret } from '@/services/interpretationService';

const result = await interpret({
  sourceType: 'speech' | 'text' | 'symbols',
  transcript?: string,
  symbols?: string[],
  imageDataUrl?: string,
  language?: string,
  urgencyHint?: 'LOW' | 'NORMAL' | 'HIGH',
  onStreamChunk?: (partialPrimaryText: string) => void,
});
```

`interpret` delegates to **`GemmaInterpreterAdapter`** only. There is no parallel “mock inference” path in the app.

---

## Model tiers (routing narrative)

| Id | Role | Typical use |
|----|------|-------------|
| **E2B** | Fast / real-time | Short speech, typed shortcuts |
| **E4B** | Fine-tuned slot | Symbol board expansion |
| **27B** | Reasoning / multimodal | Camera + speech, HIGH `urgencyHint` |

`chooseModel(req)` in `src/services/modelRouter.ts` returns `{ model, reason }` from input shape only. Swap for a learned router (e.g. Cactus) without UI changes.

---

## Customizing Ollama integration

The adapter already:

1. Builds a structured prompt from `InterpretationInput` (including symbol list and vision context).
2. Calls `chooseModel` for tier + routing reason.
3. Resolves the Ollama model name from `localStorage` per tier.
4. Streams NDJSON, extracts progressive `primaryText` for UI, parses final JSON, applies `applyUrgencyGuard`.

To change behavior, edit **`GemmaInterpreterAdapter.ts`** (prompt, timeout, base URL, or switch to `/v1/chat/completions`). Keep throwing **`GemmaNotConnectedError`** when the backend is unreachable — do not silently invent answers.

---

## Emergency + other integrations

**Emergency (live when configured):**

```ts
await triggerEmergency({ message, caregiverPhone, ts });
```

**Still stubs (implement behind a server you control):**

```ts
await sendTestSms(phone);
await testConnection(apiKey);
await runScene(scene);
```

Keep Twilio credentials and SmartThings tokens out of the PWA bundle; use small HTTPS proxies.

---

## Offline vs cloud

- **PWA shell:** Workbox precaches the app; the UI loads offline.
- **Interpretation:** Requires a reachable Ollama (typically same host or LAN). No offline LLM is bundled in this repo.

---

## Remaining work before full production

- Wire **Twilio** test SMS + any server-side voice path you need.
- Wire **SmartThings** OAuth + REST via proxy.
- STT language picker / noise handling improvements.
- Security, consent, and retention policies for any hosted proxy.

For layer diagrams, see [ARCHITECTURE.md](./ARCHITECTURE.md).
