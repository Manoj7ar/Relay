# Gemma 4, routing, and integrations

This file is the **single source of truth** for judges and contributors: what Relay assumes about models, what is **mocked in the repo**, and where to plug in **Ollama**, **Cactus**, **Unsloth**, and device integrations.

## What is mocked today (this repository)

| Capability | Status | Location |
|------------|--------|----------|
| Gemma 4 inference (E2B / E4B / 27B) | **Mocked** | `src/services/modelRouter.ts` — `inferE2B`, `inferE4B`, `infer27B` simulate latency and text |
| Cactus-style routing | **Rule-based stub** | `chooseModel()` — replace with your routing API while keeping `RoutingDecision` |
| Unsloth fine-tune metrics | **UX + local metrics only** | `FineTuningContext` |
| Speech recognition | **Stub** | `speech.ts` — returns timed mock transcripts |
| Camera | **Stub** | `camera.ts` |
| Twilio voice/SMS | **Mock** | `emergency.ts`, `twilio.ts` |
| SmartThings | **Mock** | `smartthings.ts` |

The **UI and types** are production-shaped so swapping mocks for HTTP/WebSocket calls to Ollama or a small gateway is bounded work.

## Model tiers (conceptual)

Relay labels three **Gemma-family** slots for product narrative and routing:

| Id | Role | Typical use |
|----|------|----------------|
| **E2B** | Fast / real-time | Short utterances, low-latency path |
| **E4B** | Fine-tuned / personalized | Symbol and phrase expansion after user-specific tuning (Unsloth narrative) |
| **27B** | Reasoning / multimodal | Vision+audio, high-urgency, longer reasoning |

**Selection today** is implemented in `chooseModel()` (see `modelRouter.ts`). A production **Cactus** router would replace the body of `chooseModel` and optionally add telemetry.

## Why Gemma 4 (product narrative)

- **Fragmented speech** from ALS, aphasia, dysarthria, or Parkinson’s does not match clean ASR output. A compact instruction-tuned model family (Gemma 4) is appropriate for **intent reconstruction**, **multilingual** caregiver lines, and **safety-aware** escalation when urgency is high.
- **On-device or local** deployment (e.g. Ollama) supports privacy and offline-first use; the PWA shell is already offline-capable.

## Offline vs cloud

- **Offline (today)**: Service worker precaches the app shell; interpretation is still **mocked in-process** (no GPU required for the demo).
- **Target architecture**: Run Gemma via **Ollama** (or similar) on the same LAN or on-device; the same `infer*` functions become HTTP clients.

## Unsloth fine-tuning

- Settings → **Personalization** shows **before/after accuracy** and sample counts — **scaffold** for per-user LoRA or adapter fine-tunes trained with Unsloth (or your pipeline).
- `FineTuningContext` persists lightweight counters; connect to your training job results when available.

## Ollama / local inference

1. Expose OpenAI-compatible or native Ollama endpoints for each tier (or one model with different system prompts).
2. Replace `runMock` inside `inferE2B` / `inferE4B` / `infer27B` with `fetch` to your server.
3. Keep **`chooseModel`** output aligned with which endpoint you call.

## SmartThings and Twilio

- **SmartThings**: `runScene` and `testConnection` are stubs; production uses OAuth/API tokens via a **caregiver-configured** integration (see Settings UI).
- **Twilio**: Emergency and test SMS go through **server-side** proxies in production so API secrets are not in the PWA bundle.

## Demo mode vs live (when wired)

- **Demo mode** (Settings): Disables reliance on real hardware where applicable; Judge Demo uses **scripted** flows only.
- **Live mode** (future): Real mic → STT → `runInference` → TTS; optional camera frames to `27B` path.

For architecture layers, see [ARCHITECTURE.md](./ARCHITECTURE.md).
