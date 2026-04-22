# Relay

**Relay** is a mobile-first PWA for people whose speech is hard to understand — including ALS, stroke-related aphasia, dysarthria, and Parkinson's. It turns fragmented or unclear speech into a clear phrase the user can confirm, speak back via browser TTS, and optionally capture multimodal context from the camera.

This repository ships a **real browser-capability foundation** (mic, Web Speech STT where supported, `speechSynthesis` TTS, camera preview + frame capture, permissions) and a **real local interpretation path** via **Ollama** at `http://localhost:11434` (`GemmaInterpreterAdapter`). If Ollama is down or models are missing, the app raises `GemmaNotConnectedError` and shows that in the UI — it does not fabricate model output. No scripted scenarios, no demo mode, no fake answer dictionary.

---

## Implementation status (canonical — use this wording everywhere)

| Area | Status | Notes |
|------|--------|--------|
| Mic + RMS level | **Real** | `audioCaptureService`, `useMicrophone` |
| Speech-to-text | **Real** (browser Web Speech API) | Unsupported browsers → Type-instead sheet; browser caveats in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Text-to-speech | **Real** | `speechSynthesis` with language-matched voice |
| Camera preview + frame | **Real** | Frame passed as `imageDataUrl` into `interpret()` |
| Permissions UX | **Real** | Query + prompt + denied recovery |
| Routing policy | **Real** | `chooseModel` only — no LLM inside the router |
| Gemma / interpretation | **Real when Ollama is up** | `GemmaInterpreterAdapter` → `POST /api/generate`, streaming + JSON parse + client `urgencyGuard`; **fails honestly** if Ollama unreachable |
| Emergency dispatch | **Real when configured** | `POST` to `relay.emergency.proxyUrl` + caregiver phone; otherwise `EmergencyNotConnectedError` |
| Twilio test SMS | **Stub** | `twilio.ts` throws until wired |
| SmartThings | **Stub** | `smartthings.ts` throws until wired |

Same table is reflected in [docs/GEMMA_AND_INTEGRATIONS.md](docs/GEMMA_AND_INTEGRATIONS.md). If any other markdown (e.g. a local write-up) disagrees with this, treat **this README + `docs/`** as authoritative.

---

## Why this problem

When words do not come out reliably, communication fatigue is real. Relay is designed to reduce the gap between intent and clarity for both the speaker and caregivers, with explicit confirmation, bilingual support, RTL, and safety-aware urgency.

---

## Key source files (quick map)

| Capability | Where |
|------------|-------|
| Mic / STT / TTS / camera / permissions | `src/services/*Service.ts`, `src/hooks/use*.ts` |
| Interpretation + Ollama | `src/services/interpretation/GemmaInterpreterAdapter.ts`, `src/services/interpretationService.ts` |
| Model names (Settings → Models) | `localStorage` keys `relay.model.*`; see `ModelConfigPanel.tsx` |
| Emergency proxy | `src/services/emergency.ts` + Settings → Integrations → Emergency proxy URL |

---

## Screens

| Route | What it does |
|-------|--------------|
| `/` (Home) | Real mic, live transcript, quick phrases, symbol board, camera toggle, typed fallback sheet, TTS replay |
| `/caregiver` | History + routing log (entries appear after successful Ollama interpretations) |
| `/settings` | Accessibility, **Models** (Ollama model names + connection test), Integrations (proxy URL, caregiver phone, SmartThings fields), Language, Connectivity, Routing log, **Developer** |
| `/about` | Architecture overview + Gemma wiring notes |

---

## Architecture (one page)

```
UI (React)
  → contexts: Session, ModelRouting, Settings
  → hooks: usePermissions, useMicrophone, useSpeechRecognition, useSpeechSynthesis, useCamera
  → services: permissions, audioCapture, speechRecognition, speechSynthesis, camera
  → single entry: interpretationService.interpret(input)
      → GemmaInterpreterAdapter   ← Ollama client (edit for prompts / base URL)
```

Every user input (mic+STT, typed, quick phrases, symbols, camera frame) is funneled into one `interpret(input)` call → `GemmaInterpreterAdapter` → local Ollama. Customize prompt, timeouts, or endpoint in that adapter file if you need a non-default setup.

**Details:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · **Gemma + integrations:** [docs/GEMMA_AND_INTEGRATIONS.md](docs/GEMMA_AND_INTEGRATIONS.md)

---

## Running Gemma locally (Ollama)

1. Install [Ollama](https://ollama.com) and run `ollama serve` (default `http://localhost:11434`).
2. Pull the tags you configured under **Settings → Models** (defaults: `gemma4:e2b`, `gemma4:e4b`, `gemma4:27b` — adjust to whatever you actually have installed).
3. Open the app from a context that can reach that host (same machine, or LAN with CORS/network access as your browser allows).
4. If Ollama is unreachable, the UI shows the `GemmaNotConnectedError` message — not a fake transcript of model output.

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

## Integrations

| Topic | File | Today |
|-------|------|--------|
| Ollama / Gemma | [GemmaInterpreterAdapter.ts](src/services/interpretation/GemmaInterpreterAdapter.ts) | Local HTTP; prompts leave the browser to `localhost:11434` |
| Routing policy | [modelRouter.ts](src/services/modelRouter.ts) | Pure `chooseModel` — no network |
| Emergency | [emergency.ts](src/services/emergency.ts) | `POST` to user-set proxy URL when configured |
| Twilio test SMS | [twilio.ts](src/services/twilio.ts) | Stub — throws `TwilioNotConnectedError` |
| SmartThings | [smartthings.ts](src/services/smartthings.ts) | Stub — throws `SmartThingsNotConnectedError` |

Settings persists integration fields in `localStorage`. Only enable a proxy URL you trust; it receives emergency payloads from the PWA.

---

## Roadmap

- Wire `twilio.ts` test SMS against a real server proxy (secrets off-device).
- Wire SmartThings OAuth + scene runner via proxy.
- Optional learned router (Cactus-style) behind `chooseModel`.
- Voice banking / personalization (future; not in this repo).

---

## Ethics & privacy

Browser audio, STT, and TTS run on-device in the browser. Interpretation text is sent to **your** Ollama instance (default: same machine). Emergency flow POSTs to **your** configured HTTPS proxy only when you set it. Twilio/SmartThings remain explicit stubs until you add backends. Health-adjacent deployments need consent, retention policy, and security review beyond this hackathon codebase.

---

## License

[MIT](LICENSE)

---

## Documentation index

| Resource | Purpose |
|----------|---------|
| [docs/README.md](docs/README.md) | Doc index |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layers and data flow |
| [docs/GEMMA_AND_INTEGRATIONS.md](docs/GEMMA_AND_INTEGRATIONS.md) | Ollama/Gemma behavior + integration seams (aligned with README “canonical” table) |
| [TECHNICAL_WRITEUP.md](TECHNICAL_WRITEUP.md) | Deeper technical narrative (if present in your clone) |
| [SUBMISSION_SUMMARY.md](SUBMISSION_SUMMARY.md) | Short form blurb for hackathon portals |
| [DELIVER.md](DELIVER.md) | Delivery checklist + file tree |
