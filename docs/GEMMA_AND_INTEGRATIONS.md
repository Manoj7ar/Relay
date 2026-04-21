# Gemma 4 and integrations — wiring plan

This file is the single source of truth for what's wired, what's stubbed, and exactly how to go live with Gemma 4.

## What is real today (browser capability layer)

| Capability | How it works |
|------------|--------------|
| **Microphone** | `audioCaptureService` — `getUserMedia({ audio })` + `AnalyserNode` RMS level meter for the listening pulse. |
| **Speech-to-text** | `speechRecognitionService` — Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`). Detects unsupported browsers and falls back to the **Type instead** sheet. |
| **Text-to-speech** | `speechSynthesisService` — `window.speechSynthesis` with async voice loading and best-match language selection. |
| **Camera** | `cameraService` — `getUserMedia({ video })` preview + frame capture into `SessionContext.pendingImage` as a data URL. |
| **Permissions** | `permissionsService` — `navigator.permissions` query + `getUserMedia` request + graceful `unavailable` fallback. |

Everything above runs end-to-end without Gemma. Tap the mic, speak, watch the interim transcript stream, and see an honest "Gemma not connected" notice instead of a fabricated answer.

## What is still stubbed (awaiting implementation)

| Capability | File | Current behavior |
|------------|------|------------------|
| **Gemma 4 interpretation** | `src/services/interpretation/GemmaInterpreterAdapter.ts` | Throws `GemmaNotConnectedError`. |
| **Twilio emergency** | `src/services/emergency.ts` | Throws `EmergencyNotConnectedError`. UI surfaces the message in the banner. |
| **Twilio SMS** | `src/services/twilio.ts` | Throws `TwilioNotConnectedError`. Settings test button surfaces the message. |
| **SmartThings** | `src/services/smartthings.ts` | Throws `SmartThingsNotConnectedError`. Settings test button surfaces the message. |

None of these return fake successes. That way the UI is honest about what's real vs. what needs to be connected.

## The single interpretation entry point

Every input surface (mic → STT, typed, quick phrases, symbols, camera-attached frame) calls the same function:

```ts
import { interpret } from '@/services/interpretationService';

const result = await interpret({
  sourceType: 'speech' | 'text' | 'symbols',
  transcript?: string,
  symbols?: string[],
  imageDataUrl?: string,      // optional multimodal context
  language?: string,
  urgencyHint?: 'LOW' | 'NORMAL' | 'HIGH',
});
```

`interpret` delegates to the single adapter (`GemmaInterpreterAdapter`). Implementing that adapter's body is what takes the app from "wired plumbing" to "real Gemma answers."

## Model tiers (routing narrative)

Relay labels three Gemma-family slots for product narrative and routing:

| Id | Role | Typical use |
|----|------|-------------|
| **E2B** | Fast / real-time | Short utterances, low-latency path |
| **E4B** | Personalized | Symbol and phrase expansion after user-specific tuning |
| **26B / 31B (or 27B)** | Reasoning / multimodal | Vision+audio, high-urgency, longer reasoning |

`chooseModel(req)` in `src/services/modelRouter.ts` returns `{ model, reason }` as a pure function of input shape (text vs speech vs symbols, visionOn, urgencyHint). Swap it for a Cactus-style learned router without touching UI.

## Plugging Gemma in (step-by-step)

Open `src/services/interpretation/GemmaInterpreterAdapter.ts` and replace the stub body:

1. **Build the request.** Convert `InterpretationInput` → your model request payload (include `imageDataUrl` for multimodal).
2. **Pick a tier.** Call `chooseModel(req)` from `../modelRouter` (or swap in Cactus).
3. **Call Gemma 4.** POST to your local Ollama (`POST /api/generate` or the OpenAI-compatible `POST /v1/chat/completions`) or your hosted gateway. Respect `input.language` and the user's `primaryLanguage`.
4. **Map the response.** Return an `InterpretationResult`:
   ```ts
   {
     id, ts,
     primaryText,
     alternates: [...],
     confidence,
     urgency,                // 'LOW' | 'NORMAL' | 'HIGH'
     mood,
     detectedLanguage,
     translation?,           // optional bilingual line
     sourceModel: 'E2B' | 'E4B' | '27B',
     sourceType,
     routingReason,          // shown in the routing log
     latencyMs,
     visionUsed,
     sourceFragment,
   }
   ```
5. **Done.** The routing log, ModelChip, history, TTS playback, alternates, and emergency banner all fire from this single return value.

## Emergency + integrations wiring

The UI already calls these — they just throw today:

```ts
await triggerEmergency({ message, caregiverPhone, ts });  // src/services/emergency.ts
await sendTestSms(phone);                                 // src/services/twilio.ts
await testConnection(apiKey);                             // src/services/smartthings.ts
await runScene(scene);                                    // src/services/smartthings.ts
```

Implement these against a tiny server proxy (keep secrets out of the PWA bundle) and the existing UI (EmergencyBanner countdown, Integrations test buttons) starts working untouched.

## Offline vs cloud

- **Offline (today):** The service worker precaches the app shell.
- **Target architecture:** Run Gemma via **Ollama** on the same LAN or on-device; `GemmaInterpreterAdapter` becomes the local HTTP client. Pair with a hosted fallback only when needed.

## Remaining work before full production

- Implement `GemmaInterpreterAdapter` against Ollama.
- Wire Twilio + SmartThings via server proxies.
- STT language picker UI (language currently comes from Settings).
- Background-noise mitigation / VAD for mobile STT.
- Streaming tokens from Ollama into `StreamingText` instead of post-result reveal.

For architecture layers, see [ARCHITECTURE.md](./ARCHITECTURE.md).
