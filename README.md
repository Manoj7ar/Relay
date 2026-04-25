# Relay

Relay is a **mobile-first progressive web app (PWA)** for people whose speech is hard to understand—whether from ALS, stroke-related aphasia, dysarthria, Parkinson’s, or similar conditions. It captures voice (and optional camera context), runs speech-to-text in the browser where supported, sends text to a **local Gemma model via Ollama**, and shows a clear interpretation the user can hear again with **browser text-to-speech**, confirm, and route to caregivers when configured.

The codebase prioritizes **real browser APIs** and **honest failure modes**: if Ollama is unreachable or misconfigured, the app surfaces that error instead of inventing model output.

---

## What you can do in the app

| Area | Description |
|------|-------------|
| **Onboarding** | First-run flow for role, identity, condition, voice samples (stored locally), language, caregiver details, quick phrases, and accessibility preferences. Skippable steps where marked. |
| **Home (`/`)** | Large mic control, live transcript, interpretation card, quick phrases, symbol board, optional camera, “type instead” inline composer, language switcher, and connection status. |
| **Caregiver (`/caregiver`)** | Today’s interactions, routing log, alerts timeline, and handover note—fed from session history after successful interpretations. |
| **Settings (`/settings`)** | Profile, accessibility (contrast, text size), **Ollama base URL** and model names, **emergency** (HTTPS proxy URL + caregiver phone), language, connectivity, routing log, developer tools. |
| **About (`/about`)** | High-level architecture and how Gemma fits in. |

**Developer / QA:** append `?reset-onboarding=1` once to clear onboarding and voice sample metadata (see `App.tsx`).

---

## Tech stack

| Layer | Choice |
|-------|--------|
| UI | React 18, TypeScript (strict), Tailwind CSS |
| Build | Vite 5, `@vitejs/plugin-react` |
| Routing | React Router 6 |
| Offline install | `vite-plugin-pwa` (Workbox-generated service worker) |
| Icons | Lucide React |

---

## Prerequisites

- **Node.js 20+** (recommended)
- **npm** (or compatible client) for installs
- **Ollama** running somewhere your **browser** can reach (same machine, LAN, or tunneled host), with models pulled that match **Settings → Models** tags

---

## Setup and scripts

```bash
npm install
npm run dev          # Vite dev server → http://localhost:5173
npm run typecheck    # tsc --noEmit
npm run build        # typecheck + production bundle + PWA assets
npm run preview      # serve the production build locally
```

**Trying on a phone:** run `npm run build && npm run preview -- --host`, open the printed URL on the same network, then use **Add to Home Screen** (iOS) or the install prompt (Android).

---

## Ollama and Gemma

1. Install [Ollama](https://ollama.com) and start the daemon (`ollama serve`). The default API root is `http://127.0.0.1:11434` (often shown as `localhost:11434`).
2. Pull model tags on the Ollama host, then enter the **same tags** under **Settings → Models** so routing and `interpret()` calls match what is installed.
3. In **Settings → Models** (or the Ollama section), set **base URL** if Ollama is not on the default host—Relay resolves an empty base URL to the local default at runtime (`src/lib/ollamaUrl.ts`).
4. Open Relay from a context where **fetch** to that URL is allowed (same-origin, LAN, or CORS as applicable). If the server is down, you will see **`GemmaNotConnectedError`** (or related HTTP errors) in the UI—not fake transcripts.

Implementation detail: all interpretation goes through **`interpretationService.interpret()`** → **`GemmaInterpreterAdapter`** → `POST {baseUrl}/api/generate`. Prompts, timeouts, and multimodal fields live in that adapter.

---

## Architecture (short)

```
React UI
  └─ contexts: Settings, Session, ModelRouting
  └─ hooks: permissions, microphone, speech recognition / synthesis, camera, Ollama status
  └─ services: audio, STT, TTS, camera, emergency, routing
  └─ interpretationService.interpret(input)
        └─ GemmaInterpreterAdapter  →  Ollama HTTP API
```

Deeper diagrams, file-level notes, and browser caveats: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**. Ollama behavior and integration seams: **[docs/GEMMA_AND_INTEGRATIONS.md](docs/GEMMA_AND_INTEGRATIONS.md)**.

---

## Implementation status (canonical)

Use this table as the source of truth for what is “real” versus stubbed. If another document disagrees, prefer **this README** and **`docs/`**.

| Area | Status | Notes |
|------|--------|--------|
| Microphone + RMS level | **Real** | `audioCaptureService`, `useMicrophone` |
| Speech-to-text | **Real** (Web Speech API where supported) | Unsupported browsers → type-instead UI; see architecture doc |
| Text-to-speech | **Real** | `speechSynthesis` with language-aware voice selection |
| Camera preview + frame | **Real** | Frame passed into `interpret()` as image data |
| Permissions UX | **Real** | Query, prompt, denied paths |
| Model routing policy | **Real** | `chooseModel` in `modelRouter.ts`—no LLM inside the router |
| Gemma / interpretation | **Real when Ollama is reachable** | Streaming + JSON parse + client-side checks; fails honestly otherwise |
| Emergency dispatch | **Real when configured** | `POST` to user-set HTTPS proxy URL + caregiver phone in settings |

---

## Key files (orientation)

| Topic | Location |
|-------|----------|
| Ollama client + prompts | `src/services/interpretation/GemmaInterpreterAdapter.ts` |
| Interpretation entry | `src/services/interpretationService.ts` |
| Ollama URL resolution | `src/lib/ollamaUrl.ts` |
| Session + history | `src/contexts/SessionContext.tsx` |
| Persisted settings | `src/contexts/SettingsContext.tsx` (localStorage) |
| Emergency | `src/services/emergency.ts` |
| Voice sample blobs | `src/lib/voiceSamples.ts` (IndexedDB) |

---

## Integrations and safety

- **Ollama:** interpretation text and optional image payload leave the browser for **your** server.
- **Emergency proxy:** only used when you set a URL you trust; payloads are health-adjacent—treat production like any HIPAA-sensitive integration (consent, retention, TLS, review).

---

## Roadmap (ideas)

- Optional learned routing on top of `chooseModel`.
- Stronger voice personalization and exports (beyond current local profile + samples).

---

## Documentation index

| Document | Purpose |
|----------|---------|
| [docs/README.md](docs/README.md) | Index of `docs/` |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layers, flows, browser limits |
| [docs/GEMMA_AND_INTEGRATIONS.md](docs/GEMMA_AND_INTEGRATIONS.md) | Gemma/Ollama + integration table (aligned with README) |
| [TECHNICAL_WRITEUP.md](TECHNICAL_WRITEUP.md) | Longer technical narrative |
| [SUBMISSION_SUMMARY.md](SUBMISSION_SUMMARY.md) | Short blurb for portals |
| [DELIVER.md](DELIVER.md) | Delivery checklist and tree |

---

## License

[MIT](LICENSE)
