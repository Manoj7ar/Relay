# Technical write-up — Relay

## Overview

Relay is a **Vite + React 18 + TypeScript** PWA (strict mode, `vite-plugin-pwa` / Workbox). State is held in React Context: **Session** (interpretation, listening, history, camera frame), **ModelRouting** (append-only routing log), **Settings** (accessibility, integrations, language). Routes: Home (`/`), Caregiver (`/caregiver`), Settings (`/settings`), About (`/about`). There is **no** Judge Demo, demo mode, or scripted scenario engine in this codebase.

## Architecture (concise)

1. **UI** — `src/pages/*`, `src/components/{patient,caregiver,settings,primitives}`.
2. **Hooks** — Thin wrappers: `usePermissions`, `useMicrophone`, `useSpeechRecognition`, `useSpeechSynthesis`, `useCamera` → corresponding `*Service` modules.
3. **Session pipeline** — `SessionContext.submit` builds `InterpretationInput` (including optional `imageDataUrl` and `onStreamChunk`) and calls `interpret()` from `interpretationService.ts`.
4. **Interpretation** — Single adapter **`GemmaInterpreterAdapter`**: calls **`http://localhost:11434/api/generate`** (Ollama), streams NDJSON, maps JSON to `InterpretationResult`, applies **`applyUrgencyGuard`** on transcript + model urgency. Throws **`GemmaNotConnectedError`** if Ollama is unreachable (no mock answers).
5. **Routing policy** — `modelRouter.chooseModel` is **pure** (no network); picks E2B / E4B / 27B from input shape.
6. **Integrations** — **Emergency**: `fetch` to user-configured `relay.emergency.proxyUrl` when URL and caregiver phone are set; otherwise throws `EmergencyNotConnectedError`.

See **docs/ARCHITECTURE.md** and **docs/GEMMA_AND_INTEGRATIONS.md** for diagrams and the same “real vs stub” table as **README.md**.

## Multilingual & RTL

`detectedLanguage` from the model updates session direction (`useRTL` / `directionFor`). Optional `translation` line is shown for bilingual caregiver readability. **LanguageBadge** uses BCP-47 codes with flag + native label fallbacks.

## Offline

The service worker precaches the **shell**. **Interpretation requires a reachable Ollama** (typically same machine or LAN, subject to browser mixed-content / CORS rules). There is no bundled on-device LLM in this repo.

## Emergency path

HIGH urgency arms a cancellable countdown, then **`triggerEmergency`**. If proxy URL + phone are configured, a **real HTTP POST** is sent; otherwise the user sees **`EmergencyNotConnectedError`** text — not a fake “call placed” state.

## Accessibility

Large tap targets, `aria-live` on streaming interpretation text, reduced-motion support, high-contrast via `data-contrast`, haptic tap when a new interpretation is received (where `navigator.vibrate` exists).

## Limitations (explicit)

- **STT** depends on the **Web Speech API**; not all browsers implement it (e.g. Firefox desktop → typed fallback).
- **Ollama** must be running with pulled model tags matching **Settings → Models** defaults or your overrides.
- **Emergency** does not bundle a carrier; you implement SMS/voice on the proxy you host.
- **Clinical / HIPAA** deployment is out of scope for this hackathon repo.

## Evaluation

If present, `evaluation/` may hold benchmark artifacts; the live app’s correctness for judges is **runtime behavior** (browser + Ollama), not mocked inference rows.
