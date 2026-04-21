# Gemma 4, routing, and integrations

This file is the **single source of truth** for judges and contributors: what Relay assumes about models, what is **mocked in the repo**, and where to plug in **Ollama**, **Cactus**, **Unsloth**, and device integrations.

## What is real today (browser capability layer)

Relay exposes real browser pillars through typed services:

- **Microphone**: `audioCaptureService` (`getUserMedia({ audio })` + analyser level meter).
- **Speech-to-text**: `speechRecognitionService` wrapping Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`). Detects unsupported browsers and falls back to the Type-instead sheet.
- **Text-to-speech**: `speechSynthesisService` (`window.speechSynthesis`) with async voice loading and best-match language selection.
- **Camera**: `cameraService` for preview + frame capture (stored as a data URL on `SessionContext.pendingImage`).
- **Permissions**: `permissionsService` (`navigator.permissions` query + `getUserMedia` request, with `unavailable` fallback).

Everything above runs without Gemma. The session log, routing log, and emergency countdown are all fed from these real inputs.

## What is still mocked / pending

| Capability | Status | Location |
|------------|--------|----------|
| Gemma 4 inference (E2B / E4B / 27B) | **Mocked** | `src/services/modelRouter.ts` — `inferE2B`, `inferE4B`, `infer27B` simulate latency + text |
| Cactus-style routing | **Rule-based stub** | `chooseModel()` — replace with your routing API while keeping `RoutingDecision` |
| Unsloth fine-tune metrics | **UX + local metrics only** | `FineTuningContext` |
| Twilio voice/SMS | **Mock** | `services/emergency.ts`, `services/twilio.ts` |
| SmartThings | **Mock** | `services/smartthings.ts` |
| Multimodal vision inference | **Not wired** | Camera frame is captured into `SessionContext.pendingImage`; `MockRouterAdapter` + `GemmaInterpreterAdapter` are the plug-in points |

## Interpretation adapter architecture

`interpretationService.interpret(input, { mode })` dispatches to one of three adapters based on `settings.devMode.interpreter`:

| Mode | Adapter | Behavior |
|------|---------|----------|
| `browser` | `BrowserPassthroughAdapter` | Normalizes the transcript (trim + capitalize + optional fragment-map expand). No AI. The default for real-mic flows before Gemma ships. |
| `mock` | `MockRouterAdapter` | Wraps `chooseModel` + `runInference` from `modelRouter.ts`. Preserves the RoutingLog + ModelChip. Used by demo scenarios. |
| `gemma` | `GemmaInterpreterAdapter` | Placeholder — throws `NotImplemented`. This is where you wire Ollama. |

The `InterpretationResult` shape is a superset of the future Gemma response so the UI never changes when swapping adapters. This means **the Home loop already works end-to-end** (mic → STT → interpretation → confirm → TTS → log) before Gemma is integrated.

## Model tiers (conceptual)

Relay labels three **Gemma-family** slots for product narrative and routing:

| Id | Role | Typical use |
|----|------|----------------|
| **E2B** | Fast / real-time | Short utterances, low-latency path |
| **E4B** | Fine-tuned / personalized | Symbol and phrase expansion after user-specific tuning (Unsloth narrative) |
| **27B** | Reasoning / multimodal | Vision+audio, high-urgency, longer reasoning |

**Selection today** is implemented in `chooseModel()` inside `MockRouterAdapter`. A production **Cactus** router would replace the body of `chooseModel` and optionally add telemetry.

## Why Gemma 4 (product narrative)

- **Fragmented speech** from ALS, aphasia, dysarthria, or Parkinson's does not match clean ASR output. A compact instruction-tuned model family (Gemma 4) is appropriate for **intent reconstruction**, **multilingual** caregiver lines, and **safety-aware** escalation when urgency is high.
- **On-device or local** deployment (e.g. Ollama) supports privacy and offline-first use; the PWA shell is already offline-capable.

## Plugging Gemma in (check list)

Implement `src/services/interpretation/GemmaInterpreterAdapter.ts`:

1. Replace the `NotImplemented` body with a `fetch` to your local Ollama endpoint (OpenAI-compatible `POST /v1/chat/completions` or Ollama's `POST /api/generate`).
2. Select between `E2B` / `E4B` / `27B` via Cactus or by mirroring `chooseModel` rules.
3. Pass multimodal payloads (`input.imageDataUrl`) when available — Relay already captures frames into the session.
4. Run the emergency classifier before returning a `HIGH` urgency result.
5. Respect `input.language` and `settings.language.primaryLanguage` for multilingual inference.
6. Return a populated `InterpretationResult`, including `routingReason` + `latencyMs` so the caregiver routing log + ModelChip remain meaningful.
7. Flip the mode in Settings → Developer → Interpreter to `Gemma 4 (local)` (or set it as the default at build time).

## Offline vs cloud

- **Offline (today)**: Service worker precaches the app shell; interpretation runs fully in-browser (either passthrough or mock).
- **Target architecture**: Run Gemma via **Ollama** (or similar) on the same LAN or on-device; `GemmaInterpreterAdapter` becomes the HTTP client.

## Unsloth fine-tuning

- Settings → **Personalization** shows **before/after accuracy** and sample counts — **scaffold** for per-user LoRA or adapter fine-tunes trained with Unsloth (or your pipeline).
- `FineTuningContext` persists lightweight counters; connect to your training job results when available.

## SmartThings and Twilio

- **SmartThings**: `runScene` and `testConnection` are stubs; production uses OAuth/API tokens via a **caregiver-configured** integration (see Settings UI).
- **Twilio**: Emergency and test SMS go through **server-side** proxies in production so API secrets are not in the PWA bundle.

## Demo mode vs live

- **Demo mode** (Settings): Disables real hardware (mic/camera). Judges only see scripted Judge Demo scenarios + manual text input, which run through `MockRouterAdapter`.
- **Live mode** (default): Real mic → STT → `interpretationService.interpret(...)` → TTS; camera frames attach to the next interpretation call. Adapter chosen by the Developer selector.

## Remaining work before full production

- Wire `GemmaInterpreterAdapter` to Ollama (see above).
- STT language picker UI (the lang comes from Settings today).
- Background-noise mitigation / VAD for better STT on mobile.
- Voice-bank wiring (currently a wizard scaffold in Settings).
- Real SmartThings / Twilio proxies.
- Streaming tokens from Ollama into `StreamingText` instead of the current post-result stream.

For architecture layers, see [ARCHITECTURE.md](./ARCHITECTURE.md).
