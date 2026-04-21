# Relay

**Relay** is a mobile-first PWA for people whose speech is hard to understand — including ALS, stroke-related aphasia, dysarthria, and Parkinson's. It turns fragmented or unclear speech into a clear phrase the user can confirm, speak back via browser TTS, and optionally capture multimodal context from the camera.

This repository ships a **real browser-capability foundation** — permissions, microphone capture, speech-to-text, text-to-speech, and camera preview all run on real browser APIs — with a **single swap point** (`GemmaInterpreterAdapter`) that takes the app from "input pipeline wired" to "Gemma 4 answering" without any UI rewrite. No scripted scenarios, no fake answers, no demo mode.

---

## Why this problem

When words do not come out reliably, communication fatigue is real. Relay is designed to reduce the gap between intent and clarity for both the speaker and caregivers, with explicit confirmation, bilingual support, RTL, and safety-aware urgency.

---

## What's wired today

| Capability | Status | Where |
|------------|--------|-------|
| Microphone permission + capture | Real | `src/services/audioCaptureService.ts`, `src/hooks/useMicrophone.ts` |
| Speech-to-text (interim + final) | Real (browser-native) | `src/services/speechRecognitionService.ts`, `src/hooks/useSpeechRecognition.ts` |
| Text-to-speech (replay, cancel, language-matched voice) | Real | `src/services/speechSynthesisService.ts`, `src/hooks/useSpeechSynthesis.ts` |
| Camera permission + preview + frame capture | Real | `src/services/cameraService.ts`, `src/hooks/useCamera.ts` |
| Permissions query + prompt + denied-recovery copy | Real | `src/services/permissionsService.ts`, `src/hooks/usePermissions.ts` |
| Routing policy (`chooseModel`) | Real | `src/services/modelRouter.ts` |
| Gemma 4 interpretation | **Stub** (throws until wired) | `src/services/interpretation/GemmaInterpreterAdapter.ts` |
| Emergency dispatch (Twilio) | **Stub** (throws until wired) | `src/services/emergency.ts` |
| Twilio SMS | **Stub** (throws until wired) | `src/services/twilio.ts` |
| SmartThings smart-home | **Stub** (throws until wired) | `src/services/smartthings.ts` |

The app surfaces stub errors honestly: tap the mic, speak, and you'll see a real transcript → a real "Gemma not connected" status — not a fake answer.

---

## Screens

| Route | What it does |
|-------|--------------|
| `/` (Home) | Real mic, live transcript, quick phrases, symbol board, camera toggle, typed fallback sheet, TTS replay |
| `/caregiver` | History + routing log (populated once interpretation is wired) |
| `/settings` | Accessibility, Integrations (real config fields), Language, Connectivity, Routing log, **Developer** (capability status dashboard) |
| `/about` | Architecture overview + Gemma wiring notes |

---

## Architecture (one page)

```
UI (React)
  → contexts: Session, ModelRouting, Settings
  → hooks: usePermissions, useMicrophone, useSpeechRecognition, useSpeechSynthesis, useCamera
  → services: permissions, audioCapture, speechRecognition, speechSynthesis, camera
  → single entry: interpretationService.interpret(input)
      → GemmaInterpreterAdapter   ← implement this to light everything up
```

Every user input (mic+STT, typed, quick phrases, symbols, camera frame) is funneled into one `interpret(input)` call. Implement the adapter body and the entire app starts producing real responses.

**Details:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · **Gemma wiring plan:** [docs/GEMMA_AND_INTEGRATIONS.md](docs/GEMMA_AND_INTEGRATIONS.md)

---

## Plugging Gemma 4 in

1. Open `src/services/interpretation/GemmaInterpreterAdapter.ts`.
2. Replace the `throw new GemmaNotConnectedError()` body with:
   - Build an `InferenceRequest` from `InterpretationInput`.
   - Call `chooseModel(req)` from `src/services/modelRouter.ts` (or swap in your own router).
   - POST to your local Ollama (or hosted) Gemma 4 endpoint.
   - Return an `InterpretationResult` (primaryText, alternates, confidence, urgency, mood, detectedLanguage, sourceModel, routingReason, latencyMs, …).
3. That's it. Every input surface — mic, typed, quick phrases, symbols, camera-attached frame — now produces real answers. The routing log + ModelChip populate automatically.

---

## Setup & development

**Stack:** Vite, React 18, TypeScript (strict), Tailwind CSS, React Router, `vite-plugin-pwa` (Workbox).

```bash
npm install
npm run dev          # http://localhost:5173
npm run typecheck
npm run build        # tsc + production build + service worker
npm run preview
```

**Node:** 20+ recommended.

**Phone install:** `npm run build && npm run preview -- --host`, open the URL on the same LAN, then Add to Home Screen (iOS) or install prompt (Android).

---

## Integrations (real config, stub bodies)

| Topic | File |
|-------|------|
| Gemma adapter swap | [src/services/interpretation/GemmaInterpreterAdapter.ts](src/services/interpretation/GemmaInterpreterAdapter.ts) |
| Routing policy | [src/services/modelRouter.ts](src/services/modelRouter.ts) |
| SmartThings | [src/services/smartthings.ts](src/services/smartthings.ts) |
| Twilio | [src/services/twilio.ts](src/services/twilio.ts) |
| Emergency dispatch | [src/services/emergency.ts](src/services/emergency.ts) |

The Settings → Integrations panel stores real API keys / phone numbers in `localStorage`; wiring the services above makes the test buttons actually work.

---

## Roadmap

- Implement `GemmaInterpreterAdapter` against a local Ollama endpoint (E2B / E4B / 26B / 31B).
- Wire Twilio Voice/SMS proxy for emergency + caregiver pings.
- Wire SmartThings OAuth + scene runner.
- Add a learned router (Cactus-style) behind `chooseModel`.
- Add on-device voice banking / personalization (once TTS target model is picked).

---

## Ethics & privacy

Relay is built for dignity and clarity: nothing leaves the device until a service is explicitly wired. Voice banking and health-adjacent data deserve explicit consent and clear retention policies in production.

---

## License

[MIT](LICENSE)

---

## Documentation index

| Resource | Purpose |
|----------|---------|
| [docs/README.md](docs/README.md) | Doc index |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layers and data flow |
| [docs/GEMMA_AND_INTEGRATIONS.md](docs/GEMMA_AND_INTEGRATIONS.md) | Gemma wiring plan + integration seams |
