# Gemma 4 and integrations — wiring plan

This document matches the **canonical implementation-status table** in the repository [README.md](../README.md). If any other write-up disagrees, **README + this file + [ARCHITECTURE.md](./ARCHITECTURE.md)** win.

---

## What is real today

### Browser capability layer (no Ollama required)

| Capability | How it works |
|------------|--------------|
| **Microphone** | `audioCaptureService` — `getUserMedia({ audio })` + `AnalyserNode` RMS level. |
| **Speech-to-text** | `speechRecognitionService` — Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`). Unsupported browsers → **Type instead** sheet. |
| **Text-to-speech** | `speechSynthesisService` — `window.speechSynthesis` with language-matched voice selection. |
| **Camera** | `cameraService` — `getUserMedia({ video })` preview + frame capture into `SessionContext.pendingImage` as a data URL. |
| **Patient Dictionary** | `patientDictionary` — IndexedDB corpus of carer-confirmed signals, meanings, tags, confirmations, and optional image frames. Browsing/import/export does not require Ollama. |
| **Permissions** | `permissionsService` — `navigator.permissions` + `getUserMedia` with clear denied / unavailable handling. |

You can verify mic → interim transcript → typed fallback without running Ollama. Full “clear phrase + TTS readback + routing log line” requires Ollama (below).

### Interpretation (requires local Ollama)

| Capability | File | Behavior |
|------------|------|----------|
| **Gemma via Ollama** | `src/services/interpretation/GemmaInterpreterAdapter.ts` | `POST http://localhost:11434/api/generate` with `stream: true`, optional `images[]` from camera, JSON response mapping to `InterpretationResult`, client-side `applyUrgencyGuard`. On failure / non-OK / network error → **`GemmaNotConnectedError`** (honest; no fake text). |
| **Dictionary personalization** | `src/lib/patientDictionary.ts` + `GemmaInterpreterAdapter` | Loads recent relevant entries from IndexedDB, injects compact JSON as “Patient's known signals,” validates returned `dictionaryMatchIds`, and passively increments confirmations. |
| **Handover tools** | `src/services/interpretation/HandoverAgent.ts` + `src/services/interpretation/tools/` | `POST /api/chat` with Ollama tools. Tool calls are visible in UI and routing log. Unsupported tool models → `HandoverToolCapabilityError`. |
| **Model tag names** | Settings → **Models** | `localStorage` keys `relay.model.fast`, `relay.model.finetuned`, `relay.model.quality` (defaults `gemma4:e2b`, `gemma4:e4b`, `gemma4:27b`). |

### Emergency (optional proxy)

| Capability | File | Behavior |
|------------|------|----------|
| **Emergency dispatch** | `src/services/emergency.ts` | When `relay.emergency.proxyUrl` and caregiver phone are set, `POST`s JSON to your proxy. Otherwise **`EmergencyNotConnectedError`**. |

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

`patientLanguage` / `caregiverLanguage` come from **Settings → Language**. The model returns **`inferredSpeaker`** (`patient` | `caregiver`) using the current transcript, optional **conversation tail** (recent session lines), and linguistic cues — not browser voice biometrics. `sessionLastInferredSpeaker` carries the previous turn into the prompt and STT hints for smoother follow-on. Optional **`speakerRole`** still forces attribution (e.g. symbol board → patient).

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

## Model tiers (routing narrative)

| Id | Role | Typical use |
|----|------|-------------|
| **E2B** | Fast / real-time | Short speech, typed shortcuts |
| **E4B** | Fine-tuned slot | Symbol board expansion |
| **27B** | Reasoning / multimodal | Camera + speech, compound signals, HIGH `urgencyHint`, handover agent |

`chooseModel(req)` in `src/services/modelRouter.ts` returns `{ model, reason }` from input shape only. There is no network or dictionary lookup in the router. Swap for a learned router (e.g. Cactus) without UI changes.

---

## Handover tool registry

The handover agent uses Ollama chat tools, not prompt-only pseudo tools:

| Tool | Reads / writes |
|------|----------------|
| `get_session_history` | Session history inside the shift window |
| `get_dictionary_deltas` | IndexedDB patient dictionary entries created or updated since shift start |
| `get_alert_log` | HIGH-urgency session events |
| `get_routing_log` | Model routing and handover tool audit entries |
| `summarize_patterns` | Rule-based local pattern summary, no LLM |
| `write_handover_note` | Persists the final structured note to IndexedDB |

If Ollama is down, Relay raises `GemmaNotConnectedError`. If the selected model or Ollama build does not support tools, Relay raises `HandoverToolCapabilityError` and shows that text in the Handover tab.

---

## Customizing Ollama integration

The adapter already:

1. Builds a structured prompt from `InterpretationInput` (including symbol list and vision context).
2. Calls `chooseModel` for tier + routing reason.
3. Resolves the Ollama model name from `localStorage` per tier.
4. Streams NDJSON, extracts progressive `primaryText` for UI, parses final JSON, applies `applyUrgencyGuard`.

To change behavior, edit **`GemmaInterpreterAdapter.ts`** (prompt, timeout, base URL, or switch to `/v1/chat/completions`). Keep throwing **`GemmaNotConnectedError`** when the backend is unreachable — do not silently invent answers.

---

## Emergency

**When proxy URL + caregiver phone are set:**

```ts
await triggerEmergency({ message, caregiverPhone, ts });
```

The proxy URL is read from `localStorage` (`relay.emergency.proxyUrl`). The phone comes from **Settings → Integrations** (persisted with the rest of settings). Implement SMS, voice, or paging **on your server**; Relay only sends JSON from the browser.

---

## Offline vs cloud

- **PWA shell:** Workbox precaches the app; the UI loads offline.
- **Patient corpus:** IndexedDB dictionary and handover note browsing stay local and work without network.
- **Interpretation / handover generation:** Requires a reachable Ollama (typically same host or LAN). No offline LLM is bundled in this repo.

---

## Remaining work before full production

- STT language picker / noise handling improvements.
- Security, consent, and retention policies for any hosted emergency proxy.

For layer diagrams, see [ARCHITECTURE.md](./ARCHITECTURE.md).
