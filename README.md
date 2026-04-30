# Relay

Relay is a **mobile-first progressive web app (PWA)** for people whose speech is hard to understand—whether from ALS, stroke-related aphasia, dysarthria, Parkinson’s, or similar conditions. It captures voice (and optional camera context), runs speech-to-text in the browser or an optional **local-only STT sidecar**, sends text to a **local Gemma model via Ollama**, and shows a clear interpretation the user can hear again with **browser text-to-speech**, confirm, and route to caregivers when configured.

**Wedge (one line):** Relay pairs **browser-native speech** with **local Gemma 4 via Ollama** so disfluent or fragmented speech can become a clear, caregiver-ready phrase—**without cloud inference** for the core interpret path—plus honest errors when the model is unreachable.

The codebase prioritizes **real browser APIs** and **honest failure modes**: if Ollama is unreachable or misconfigured, the app surfaces that error instead of inventing model output.

---

## What you can do in the app

| Area | Description |
|------|-------------|
| **Onboarding** | First-run flow for role, identity, condition, voice samples (stored locally), language, caregiver details, personal phrases (for Gemma context), and accessibility preferences. Skippable steps where marked. |
| **Home (`/`)** | Large mic control, live transcript, interpretation card, symbol board, optional camera, “type instead” inline composer, language switcher, and connection status. |
| **Caregiver (`/caregiver`)** | Today’s interactions, patient dictionary, routing log, alerts timeline, and tool-built handover note—fed from local browser data after successful interpretations. |
| **Settings (`/settings`)** | Hub lists categories; each opens its own screen — e.g. `/settings/profile`, `/settings/language`, `/settings/accessibility`, `/settings/models` (Ollama URL, model tags, **connectivity** + test), `/settings/routing`, `/settings/developer`. |
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
- **Ollama** running somewhere your **browser** can reach (same machine, LAN, or tunneled host), with models pulled that match **Settings → Models & connectivity** tags (defaults in Advanced unless changed)

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

### Hackathon / judge quickstart

Use this path to verify the repo end-to-end (see also [docs/GEMMA_AND_INTEGRATIONS.md](docs/GEMMA_AND_INTEGRATIONS.md) for CORS and wire details).

1. **Clone** the repository and install **Node.js 20+**.
2. Run **`npm install`** at the repo root.
3. Install [Ollama](https://ollama.com) and start **`ollama serve`** on a host your browser can reach.
4. Pull the three default model tags (must match **Settings → Models & connectivity** unless you change both code defaults and settings):

   ```bash
   ollama pull gemma4:e2b
   ollama pull gemma4:e4b
   ollama pull gemma4:27b
   ```

5. Run **`npm run dev`** and open **http://localhost:5173** (or the URL Vite prints).
6. Open **Settings → Models & connectivity** (`/settings/models`) and confirm **Ollama base URL** (e.g. `http://127.0.0.1:11434`) and the **same three tags** as in step 4 (under Advanced if you overrode defaults).
7. If the app is served from **https://** but Ollama is **http://** on another host, the browser may block requests (mixed content) or require **CORS** on Ollama—see [docs/GEMMA_AND_INTEGRATIONS.md](docs/GEMMA_AND_INTEGRATIONS.md#ollama-wire-protocol-what-judges-can-grep).
8. Optional: open **`/?reset-onboarding=1`** once to reset first-run onboarding (see `App.tsx`).
9. **Happy path:** Home → allow microphone → speak → wait for interpretation card → use read-aloud (TTS).
10. **Multimodal path:** Enable camera, capture context, speak → routing should prefer the **27B** tier for `vision+speech` / compound (see [docs/MODEL_ROUTING.md](docs/MODEL_ROUTING.md)).

### Model tags vs Gemma 4 naming

Default Ollama tags are defined in **`src/lib/ollamaModelConfig.ts`** (`OLLAMA_MODEL_DEFAULT_TAG`). They must match tags you **pull** in Ollama and optional overrides under **Settings → Models & connectivity** (Advanced).

For **hackathon or Google naming guidelines** (official asset and model variant names), verify against the sponsor’s current documentation before submitting—update Settings tags locally if the published names differ; do not assume this README tracks every rename.

---

## Ollama and Gemma

1. Install [Ollama](https://ollama.com) and start the daemon (`ollama serve`). The default API root is `http://127.0.0.1:11434` (often shown as `localhost:11434`).
2. Pull model tags on the Ollama host, then enter the **same tags** under **Settings → Models & connectivity** (Advanced) so routing and `interpret()` calls match what is installed.
3. In **Settings → Models & connectivity**, set **base URL** if Ollama is not on the default host—Relay resolves an empty base URL to the local default at runtime (`src/lib/ollamaUrl.ts`).
4. Open Relay from a context where **fetch** to that URL is allowed (same-origin, LAN, or CORS as applicable). If the server is down, you will see **`GemmaNotConnectedError`** (or related HTTP errors) in the UI—not fake transcripts.

Implementation detail: all interpretation goes through **`interpretationService.interpret()`** → **`GemmaInterpreterAdapter`** → `POST {baseUrl}/api/generate`. Prompts, timeouts, and multimodal fields live in that adapter.

---

## Architecture (short)

```
React UI
  └─ contexts: Settings, Session, ModelRouting
  └─ hooks: permissions, microphone, speech recognition / synthesis, camera, Ollama status
  └─ services: audio, STT, TTS, camera, routing
  └─ interpretationService.interpret(input)
        └─ GemmaInterpreterAdapter  →  Ollama HTTP API
  └─ IndexedDB: voice samples, patient dictionary, handover notes
```

Deeper diagrams, file-level notes, and browser caveats: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**. Ollama behavior and integration seams: **[docs/GEMMA_AND_INTEGRATIONS.md](docs/GEMMA_AND_INTEGRATIONS.md)**.

---

## Implementation status (canonical)

Use this table as the source of truth for what is “real” versus stubbed. If another document disagrees, prefer **this README** and **`docs/`**.

| Area | Status | Notes |
|------|--------|--------|
| Microphone + RMS level | **Real** | `audioCaptureService`, `useMicrophone` |
| Speech-to-text | **Real** (Web Speech API where supported, optional local STT sidecar) | Unsupported / blocked browser STT → type-instead UI or `VITE_RELAY_LOCAL_STT_URL`; see architecture doc |
| Text-to-speech | **Real** | `speechSynthesis` with language-aware voice selection |
| Camera preview + frame | **Real** | Frame passed into `interpret()` as image data |
| Patient Dictionary | **Real** | IndexedDB corpus with add/edit/delete/import/export; entries injected into Gemma prompts |
| Multimodal fusion | **Real when Ollama is reachable** | Concurrent speech/camera/symbol channels route as compound input to 27B |
| Permissions UX | **Real** | Query, prompt, denied paths |
| Model routing policy | **Real** | `chooseModel` in `modelRouter.ts`—no LLM inside the router |
| Gemma / interpretation | **Real when Ollama is reachable** | Streaming + JSON parse + client-side checks; fails honestly otherwise |
| Bilingual patient / caregiver | **Real when Ollama is reachable** | Gemma returns `patientLanguageText` + `caregiverLanguageText` + `inferredSpeaker`; UI/TTS use `detectedLanguage` + bilingual routing. STT locale follows **session inference** (model + script heuristics + last turn), not biometrics — see `transcriptSpeakerHint.ts` |
| Handover agent | **Real when Ollama tool calling is supported** | `/api/chat` tool loop reads local history/dictionary/alerts/routing and writes note to IndexedDB |
---

## Key files (orientation)

| Topic | Location |
|-------|----------|
| Ollama client + prompts | `src/services/interpretation/GemmaInterpreterAdapter.ts` |
| Interpretation entry | `src/services/interpretationService.ts` |
| Bilingual hero routing | `src/lib/bilingualHero.ts` |
| Speaker inference (session + transcript) | `src/lib/transcriptSpeakerHint.ts`, `src/lib/conversationContext.ts` |
| Ollama URL resolution | `src/lib/ollamaUrl.ts` |
| Session + history | `src/contexts/SessionContext.tsx` |
| Persisted settings | `src/contexts/SettingsContext.tsx` (localStorage) |
| Patient dictionary | `src/lib/patientDictionary.ts` (IndexedDB) |
| Handover agent + tools | `src/services/interpretation/HandoverAgent.ts`, `src/services/interpretation/tools/` |
| Voice sample blobs | `src/lib/voiceSamples.ts` (IndexedDB) |

---

## Trust and safety

- **Ollama:** interpretation text and optional image payload leave the browser for **your** Ollama host. There is **no** mock interpretation path: failures surface as **`GemmaNotConnectedError`** (see `GemmaInterpreterAdapter`).
- **Urgency guard:** after each successful parse, client-side **`applyUrgencyGuard`** (`src/lib/urgencyGuard.ts`) prevents the model from **downgrading** urgency when the user’s transcript clearly indicates an emergency-class phrase.
- **Patient Dictionary:** personal signal corpus stays in IndexedDB on this device unless the user manually exports JSON.

Deployment hardening (CSP, secrets pattern): [docs/SECURITY.md](docs/SECURITY.md). License and hackathon winner obligations (informational): [docs/LICENSE_NOTES.md](docs/LICENSE_NOTES.md).

---

## Roadmap (ideas)

- Optional learned routing on top of `chooseModel`.
- Stronger voice personalization and exports (beyond current local profile + samples).

---

## Documentation index

| Document | Purpose |
|----------|---------|
| [docs/SOURCE_LAYOUT.md](docs/SOURCE_LAYOUT.md) | `src/` folder map for orientation |
| [docs/README.md](docs/README.md) | Index of `docs/` |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layers, flows, browser limits |
| [docs/GEMMA_AND_INTEGRATIONS.md](docs/GEMMA_AND_INTEGRATIONS.md) | Gemma/Ollama + integration table (aligned with README) |
| [docs/MODEL_ROUTING.md](docs/MODEL_ROUTING.md) | Deterministic E2B / E4B / 27B routing (Cactus-style narrative) |
| [docs/GROUNDING.md](docs/GROUNDING.md) | Dictionary grounding + handover tools overview |
| [docs/LATENCY_AND_METRICS.md](docs/LATENCY_AND_METRICS.md) | How to record interpretation latency (`latencyMs`) |
| [docs/SECURITY.md](docs/SECURITY.md) | CSP notes, no repo secrets, Ollama/proxy trust |
| [docs/LICENSE_NOTES.md](docs/LICENSE_NOTES.md) | MIT repo + hackathon CC-BY winner note (informational) |
| [TECHNICAL_WRITEUP.md](TECHNICAL_WRITEUP.md) | Longer technical narrative |

---

## License

Relay is licensed under the [MIT License](LICENSE). Third-party notices: [NOTICE](NOTICE).

For **Kaggle / Gemma 4 Good Hackathon** rules: potential winners may have additional **sponsor license** obligations (e.g. CC-BY 4.0 on the winning submission)—see [docs/LICENSE_NOTES.md](docs/LICENSE_NOTES.md) and the official competition rules.
