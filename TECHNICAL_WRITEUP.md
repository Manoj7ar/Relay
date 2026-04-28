# Technical write-up — Relay

## Overview

Relay is a **Vite + React 18 + TypeScript** PWA (strict mode, `vite-plugin-pwa` / Workbox). State is held in React Context: **Session** (interpretation, listening, history, camera frame), **ModelRouting** (append-only routing + tool log), **Settings** (accessibility, integrations, language). Patient-specific signals, voice blobs, and handover notes are stored in IndexedDB. Routes: Home (`/`), Caregiver (`/caregiver`), Settings (`/settings`), About (`/about`). There is **no** Judge Demo, demo mode, or scripted scenario engine in this codebase.

## Architecture (concise)

1. **UI** — `src/pages/*`, `src/components/{patient,caregiver,settings,primitives}`.
2. **Hooks** — Thin wrappers: `usePermissions`, `useMicrophone`, `useSpeechRecognition`, `useSpeechSynthesis`, `useCamera` → corresponding `*Service` modules.
3. **Patient corpus** — `src/lib/patientDictionary.ts` stores carer-confirmed signal meanings in IndexedDB (`relay_patient_dictionary`) with modality and recency indexes. Export/import is JSON and stays manual.
4. **Session pipeline** — `SessionContext.submit` builds `InterpretationInput` (speech, symbols, optional `imageDataUrl`, `timeOfDay`, and `onStreamChunk`) and calls `interpret()` from `interpretationService.ts`.
5. **Interpretation** — Single adapter **`GemmaInterpreterAdapter`**: loads up to 30 relevant dictionary entries, calls **`http://localhost:11434/api/generate`** (Ollama), streams NDJSON, maps JSON to `InterpretationResult`, validates `dictionaryMatchIds`, increments matched confirmations, and applies **`applyUrgencyGuard`** on transcript + model urgency. Throws **`GemmaNotConnectedError`** if Ollama is unreachable (no mock answers).
6. **Handover agent** — `HandoverAgent` calls Ollama **`/api/chat`** with a real tool registry: session history, dictionary deltas, alert log, routing log, rule-based pattern summary, and note persistence.
7. **Routing policy** — `modelRouter.chooseModel` is **pure** (no network); picks E2B / E4B / 27B from input shape, with compound multimodal inputs forced to 27B.
8. **Integrations** — **Emergency**: `fetch` to user-configured `relay.emergency.proxyUrl` when URL and caregiver phone are set; otherwise throws `EmergencyNotConnectedError`.

See **docs/ARCHITECTURE.md** and **docs/GEMMA_AND_INTEGRATIONS.md** for diagrams and the same “real vs stub” table as **README.md**. Routing policy detail: [docs/MODEL_ROUTING.md](docs/MODEL_ROUTING.md). Grounding: [docs/GROUNDING.md](docs/GROUNDING.md). Hackathon-oriented blurbs: [SUBMISSION_SUMMARY.md](SUBMISSION_SUMMARY.md).

## Multilingual & RTL

`detectedLanguage` from the model updates session direction (`useRTL` / `directionFor`). Optional `translation` line is shown for bilingual caregiver readability. **LanguageBadge** uses BCP-47 codes with flag + native label fallbacks.

## Bilingual listener line and speaker inference

Gemma returns **`patientLanguageText`** and **`caregiverLanguageText`**; [`bilingualHero.ts`](src/lib/bilingualHero.ts) picks the **listener-facing** `primaryText` / **`ttsLang`** using `detectedLanguage` vs configured patient and caregiver locales, with ambiguity handling. **`inferredSpeaker`** (model JSON) is combined with **transcript script heuristics** and **session carry-over** in [`transcriptSpeakerHint.ts`](src/lib/transcriptSpeakerHint.ts) — this is **not** speaker diarization or voice biometrics; it is language/context/session heuristics suitable for a browser-only client.

## Offline

The service worker precaches the **shell**. The Patient Dictionary and handover notes are local IndexedDB data and remain browsable offline. **Interpretation and agent handover generation require a reachable Ollama** (typically same machine or LAN, subject to browser mixed-content / CORS rules). There is no bundled on-device LLM in this repo.

## Emergency path

HIGH urgency arms a cancellable countdown, then **`triggerEmergency`**. If proxy URL + phone are configured, a **real HTTP POST** is sent; otherwise the user sees **`EmergencyNotConnectedError`** text — not a fake “call placed” state.

## Accessibility

Large tap targets, `aria-live` on streaming interpretation text, reduced-motion support, high-contrast via `data-contrast`, haptic tap when a new interpretation is received (where `navigator.vibrate` exists).

## Limitations (explicit)

- **STT** depends on the **Web Speech API**; not all browsers implement it (e.g. Firefox desktop → typed fallback).
- **Ollama** must be running with pulled model tags matching **Settings → Models** defaults or your overrides (defaults documented in `GemmaInterpreterAdapter` and README; align tags with [Gemma / hackathon naming](https://ai.google.dev/gemma) before final demo).
- **Ollama tool calling** must be supported by the selected local model for agent handover; otherwise Relay surfaces a specific capability error.
- **Emergency** does not bundle a carrier; you implement SMS/voice on the proxy you host.
- **Clinical / HIPAA** deployment is out of scope for this hackathon repo.
- **Speaker inference** is heuristic + model-linguistic, not proof of who spoke in a biometric sense.

## Evaluation

If present, `evaluation/` may hold benchmark artifacts; the live app’s correctness for judges is **runtime behavior** (browser + Ollama), not mocked inference rows.
