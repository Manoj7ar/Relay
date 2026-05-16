# Gemma 4 and integrations — wiring plan

This document matches the **canonical implementation-status table** in the repository [README.md](../README.md). If any other write-up disagrees, **README + this file + [ARCHITECTURE.md](./ARCHITECTURE.md)** win.

---

## What is real today

### Browser capability layer (no Ollama required)

| Capability | How it works |
|------------|--------------|
| **Microphone** | `audioCaptureService` — `getUserMedia({ audio })` + `AnalyserNode` RMS level. |
| **Speech-to-text** | `speechRecognitionService` — Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) plus optional local sidecar via `VITE_RELAY_LOCAL_STT_URL`. Unsupported browsers → **Type instead** sheet. |
| **Text-to-speech** | `speechSynthesisService` — `window.speechSynthesis` with quality-ranked language match and an optional user-picked voice (Settings → Language). |
| **Camera** | `cameraService` — `getUserMedia({ video })` preview + frame capture into `SessionContext.pendingImage` as a data URL. |
| **Patient Dictionary** | `patientDictionary` — IndexedDB corpus of carer-confirmed signals, meanings, tags, confirmations, and optional image frames. Browsing/import/export does not require Ollama. |
| **Permissions** | `permissionsService` — `navigator.permissions` + `getUserMedia` with clear denied / unavailable handling. |

You can verify mic → interim transcript → typed fallback without running Ollama. Full “clear phrase + TTS readback + routing log line” requires Ollama (below).

### Interpretation (requires local Ollama)

| Capability | File | Behavior |
|------------|------|----------|
| **Gemma via Ollama** | `src/services/interpretation/GemmaInterpreterAdapter.ts` | `POST {ollamaBase}/api/generate` with `stream: true`, optional `images[]` from camera, JSON response mapping to `InterpretationResult`, client-side `applyUrgencyGuard`. On failure / non-OK / network error → **`GemmaNotConnectedError`** (honest; no fake text). |
| **Dictionary personalization** | `src/lib/patientDictionary.ts` + `GemmaInterpreterAdapter` | Loads recent relevant entries from IndexedDB, injects compact JSON as “Patient's known signals,” validates returned `dictionaryMatchIds`, and passively increments confirmations. |
| **JSON side tasks** | `src/services/interpretation/ollamaJson.ts` | Non-streaming `POST /api/generate` with `stream: false`, `format: json` — used by predictive phrases, bilingual coach, session insight, and handover drafting. |
| **Handover note** | `src/services/interpretation/HandoverAgent.ts` + `src/services/interpretation/tools/` | **Client-side** tool pipeline (history, dictionary deltas, alerts, routing log, pattern summary) → **one** `/api/generate` JSON call (27B tier via `chooseModel({ inputType: 'compound' })`) → `writeHandoverNote` persists to IndexedDB. UI timeline uses `onToolEvent` for transparency. **Not** a remote Ollama `/api/chat` tool loop. |
| **Model tag names** | Settings → **Models & connectivity** | Base URL in `relay.settings` → `ollama.baseUrl`. Optional per-tier overrides: `relay.model.fast` / `relay.model.finetuned` / `relay.model.quality` (defaults `gemma4:e2b` / `gemma4:e4b` / `gemma4:27b` in `src/lib/ollamaModelConfig.ts`). |

---

## The single interpretation entry point

Every input surface (mic → STT, typed, symbols, camera-attached frame) calls:

```ts
import { interpret } from '@/services/interpretationService';

const result = await interpret({
  sourceType: 'speech' | 'text' | 'symbols',
  transcript?: string,
  symbols?: string[],
  symbolIds?: string[],
  imageDataUrl?: string,
  gestureHints?: string[],
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night',
  patientLanguage: 'ko-KR',
  caregiverLanguage: 'en-US',
  speakerRole: 'patient', // optional; symbol board passes patient explicitly
  sessionLastInferredSpeaker: null,
  conversationTail: '…formatted recent lines…',
  language?: string,
  urgencyHint?: 'LOW' | 'NORMAL' | 'HIGH',
  onStreamChunk?: (partialPrimaryText: string) => void,
});
```

`patientLanguage` / `caregiverLanguage` come from **Settings → Language** (`/settings/language`). The model returns **`inferredSpeaker`** (`patient` | `caregiver`) using the current transcript, optional **conversation tail** (recent session lines), and linguistic cues — not browser voice biometrics. `sessionLastInferredSpeaker` carries the previous turn into the prompt and STT hints for smoother follow-on. Optional **`speakerRole`** still forces attribution (e.g. symbol board → patient).

### Bilingual JSON from Gemma

The adapter asks for:

- `patientLanguageText` — clarified intent in the patient’s configured language.
- `caregiverLanguageText` — same intent in the caregiver’s configured language.
- `primaryText` — must duplicate `patientLanguageText` so streaming previews stay stable.
- `detectedLanguage` — BCP-47 of the **source** utterance (after clarification), not the translation.
- `inferredSpeaker` — `"patient"` or `"caregiver"` for who produced this input (required from the model except symbol-only paths, which the adapter forces to patient).

The app then picks the **listener-facing** hero line and `ttsLang` in `src/lib/bilingualHero.ts`. If `detectedLanguage` does not match either configured language, Relay tie-breaks with **`inferredSpeaker`** (model → transcript script heuristic → optional explicit `speakerRole` → session carry-over) and may set `bilingualAmbiguous` so the UI can warn the user.

`interpret` delegates to **`GemmaInterpreterAdapter`** only. There is no parallel “mock inference” path in the app.

---

## Ollama wire protocol (what judges can grep)

Implementation lives in [`src/services/interpretation/GemmaInterpreterAdapter.ts`](../src/services/interpretation/GemmaInterpreterAdapter.ts) (streaming) and [`ollamaJson.ts`](../src/services/interpretation/ollamaJson.ts) (non-streaming JSON tasks).

| Aspect | Behavior |
|--------|----------|
| **Endpoints** | `POST {ollamaBase}/api/generate` (interpretation + JSON tasks), `GET {ollamaBase}/api/tags` (connectivity test in Settings). |
| **Base URL** | `getResolvedOllamaBaseUrl()` reads `relay.settings` → `ollama.baseUrl`; empty → `http://localhost:11434`. Editable in **Settings → Models & connectivity** (`ModelConfigPanel`). |
| **Streaming interpretation** | `stream: true` — response body is **NDJSON** (one JSON object per line); the client accumulates chunks until the stream ends. |
| **Structured output** | `format: 'json'` so the model is steered toward a single JSON object. |
| **Progressive UI** | While streaming, a forgiving extractor reads the in-progress `"primaryText"` field and calls `onStreamChunk` so the UI can animate text **without** leaking raw JSON. |
| **Multimodal** | When `imageDataUrl` is present, the adapter strips the base64 payload and passes it under Ollama’s `images[]` array for the same `generate` request. |
| **Timeout** | **30_000** ms (`REQUEST_TIMEOUT_MS`) on interpretation and JSON-task fetches. |
| **Failure** | Non-OK HTTP, network errors, or timeouts throw **`GemmaNotConnectedError`** — surfaced as `SessionContext` `lastError`, not fabricated phrases. |

### CORS, HTTPS, and mixed content

- **Same machine:** app on `http://localhost:5173` calling `http://127.0.0.1:11434` is the usual dev path.
- **HTTPS app → HTTP Ollama:** browsers treat this as **mixed content** and may block `fetch`; use HTTPS for Ollama (reverse proxy) or run the dev app over HTTP for local demos.
- **Cross-origin:** if the PWA origin differs from the Ollama host, Ollama (or a proxy) must send appropriate **CORS** headers for `POST` + `OPTIONS` preflight.

---

## Safety and trust

| Mechanism | File | Purpose |
|------------|------|---------|
| **Urgency guard** | [`src/lib/urgencyGuard.ts`](../src/lib/urgencyGuard.ts) | After the model returns JSON, client-side logic ensures a **clear emergency phrase** in the user transcript cannot be **downgraded** to a lower urgency bucket by a confused model. |
| **Honest connectivity** | `GemmaInterpreterAdapter` | No mock or cached “AI answer” when Ollama is down — users see an explicit error string suitable for accessibility (`aria-live` surfaces on the home flow). |
| **Dictionary id allowlist** | Adapter parse step | Returned `dictionaryMatchIds` are filtered to ids that were actually injected into the prompt, reducing hallucinated corpus references. |
| **Master power switch** | `relayPowerOn` in settings | Suspends capture and processing when off. |

For deployment-facing notes (CSP, proxies), see [SECURITY.md](./SECURITY.md).

---

## Model tiers (routing narrative)

| Id | Default Ollama tag | Role | Typical use |
|----|-------------------|------|-------------|
| **E2B** | `gemma4:e2b` | Fast / real-time | Short speech, typed shortcuts |
| **E4B** | `gemma4:e4b` | Fine-tuned slot | Symbol board expansion |
| **27B** | `gemma4:27b` | Reasoning / multimodal | Camera + speech, compound signals, HIGH `urgencyHint`, handover JSON draft |

`chooseModel(req)` in `src/services/modelRouter.ts` returns `{ model, reason }` from input shape only. There is no network or dictionary lookup in the router. Swap for a learned router (e.g. Cactus) without UI changes. Details: [MODEL_ROUTING.md](./MODEL_ROUTING.md).

---

## Handover pipeline (client tools + one generate call)

Handover does **not** register tools with Ollama’s `/api/chat`. The flow in [`HandoverAgent.ts`](../src/services/interpretation/HandoverAgent.ts):

1. Run each “tool” **in the browser** (data already in session state / IndexedDB).
2. Build one prompt with compact JSON snapshots (history capped, dictionary deltas, alerts, patterns).
3. Call `completeOllamaJsonTask` → `POST /api/generate` with `format: json`, tier **27B** (via `chooseModel({ inputType: 'compound' })`).
4. Parse required fields (`summary`, bullet arrays, `newSignalsLearned`, etc.) and persist via `writeHandoverNote.handler`.

| Step (UI `toolName`) | Implementation | LLM? |
|----------------------|----------------|------|
| `get_session_history` | `tools/getSessionHistory.ts` | No |
| `get_dictionary_deltas` | `tools/getDictionaryDeltas.ts` | No |
| `get_alert_log` | `tools/getAlertLog.ts` | No |
| `get_routing_log` | `tools/getRoutingLog.ts` | No |
| `summarize_patterns` | `tools/summarizePatterns.ts` | No (rule-based) |
| `write_handover_note` | Model JSON + `tools/writeHandoverNote.ts` | Yes (single generate) |

If Ollama is unreachable → **`GemmaNotConnectedError`**. If the model returns invalid or empty `summary` → **`HandoverToolCapabilityError`** with UI text in the Handover tab.

Structured note shape: [`src/types/handover.ts`](../src/types/handover.ts). Grounding overview: [GROUNDING.md](./GROUNDING.md).

---

## Other Ollama JSON features

| Feature | File | Tier (default) | Reference `latencyMs`¹ |
|---------|------|----------------|------------------------|
| Predictive phrase chips | `predictivePhrases.ts` | E2B | ~620 ms |
| Bilingual coach copy | `bilingualCoach.ts` | E2B | ~740 ms |
| Caregiver session insight | `caregiver/sessionInsight.ts` | E2B | ~980 ms |
| Handover note draft | `HandoverAgent.ts` | 27B (`compound`) | ~6,300 ms |

¹ Illustrative medians (Apple M2, 16 GB, Ollama 0.6.2, local dev). See [LATENCY_AND_METRICS.md](./LATENCY_AND_METRICS.md).

All use `completeOllamaJsonTask` from `ollamaJson.ts` (handover included).

---

## Onboarding and export

| Feature | File |
|---------|------|
| Seed starter dictionary after onboarding | `src/services/onboardingDictionarySeeder.ts` |
| Export session + dictionary rows as JSONL for future fine-tuning | `src/lib/fineTuneExport.ts` (Caregiver dictionary UI) |

---

## Customizing Ollama integration

The streaming adapter already:

1. Builds a structured prompt from `InterpretationInput` (including symbol list and vision context).
2. Calls `chooseModel` for tier + routing reason.
3. Resolves the Ollama model name from settings / `localStorage` per tier.
4. Streams NDJSON, extracts progressive `primaryText` for UI, parses final JSON, applies `applyUrgencyGuard`.

To change behavior, edit **`GemmaInterpreterAdapter.ts`** (prompt, timeout, base URL). For short JSON tasks, edit **`ollamaJson.ts`** or the calling service. Keep throwing **`GemmaNotConnectedError`** when the backend is unreachable — do not silently invent answers.

---

## Offline vs cloud

- **PWA shell:** Workbox precaches the app; the UI loads offline.
- **Patient corpus:** IndexedDB dictionary and handover note browsing stay local and work without network.
- **Interpretation / handover generation:** Requires a reachable Ollama (typically same host or LAN). No cloud LLM is bundled or called by this repo.
- **STT sidecar:** Optional, local-only HTTP service. The reference `npm run local-stt` script is a wiring harness; set `RELAY_STT_CMD` to your offline transcription engine if browser Web Speech is unavailable.

---

## Remaining work before full production

- STT language picker / noise handling improvements.
- Security, consent, and retention policies for any third-party endpoints you add around Ollama.
- Optional learned routing on top of `chooseModel`.

For layer diagrams, see [ARCHITECTURE.md](./ARCHITECTURE.md).
