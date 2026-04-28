# Submission summary (Kaggle / hackathon form)

**Wedge (one line).** Relay pairs **browser-native speech** with **local Gemma 4 via Ollama** so disfluent or fragmented speech can become a **clear, caregiver-ready phrase**—**without cloud inference** for the core interpret path—with **honest errors** when the model is unreachable.

**Problem.** Millions of people live with speech that is fragmented, quiet, or inconsistent — from ALS, stroke, Parkinson’s, and related conditions. Everyday needs (food, comfort, bathroom, emergency) can be lost between the speaker and caregivers or devices.

**Solution.** **Relay** is a mobile-first PWA that captures **real** microphone input and **browser-native speech-to-text** (where supported), sends the transcript (plus optional camera frame) to a **local Ollama** endpoint for **Gemma-class** interpretation, shows a clear primary phrase with alternates, supports bilingual output and RTL, and reads the result back with **real browser TTS**. There is **no** demo mode and **no** fake inference: if Ollama is unreachable, the user sees an explicit error — not a scripted answer.

**Impact tracks (Gemma 4 Good).** **Health & Sciences** (primary): communication access and caregiver-visible history. **Digital Equity & Inclusivity**: bilingual patient/caregiver routing (`patientLanguageText` / `caregiverLanguageText`, listener-facing hero via `bilingualHero.ts`), RTL, large touch targets. **Safety & Trust**: client-side **`applyUrgencyGuard`** so clear emergency phrasing is not downgraded; no mock model output when offline.

**Bilingual + listener routing.** Gemma returns parallel lines in patient and caregiver languages plus `detectedLanguage` and `inferredSpeaker`. The UI and TTS use **`ttsLang`** on the listener-facing line. Speaker attribution uses **model inference + transcript script heuristics + session carry-over** — **not** biometric voice ID (see `transcriptSpeakerHint.ts`).

**Multimodal (demo beat).** Enable camera on Home, capture context, speak a short phrase → `vision+speech` / compound routing steers to the **27B** tier (`modelRouter.ts` + `GemmaInterpreterAdapter` `images[]`).

**Gemma / Ollama.** Relay uses a **single adapter** (`GemmaInterpreterAdapter`) calling **`POST …/api/generate`** with **`stream: true`** and **`format: 'json'`**, tier tags from **Settings → Models**, and deterministic **`chooseModel`** routing (E2B / E4B / 27B). Defaults in code: `gemma4:e2b`, `gemma4:e4b`, `gemma4:27b` — align with **official Gemma / hackathon naming** before submit: [Kaggle competition](https://www.kaggle.com/competitions/gemma-4-good-hackathon), [Gemma docs](https://ai.google.dev/gemma).

**Handover / tools (≈30s video beats).** Caregiver → Handover: Ollama **`/api/chat`** tool loop (`HandoverAgent.ts`) reads local session, dictionary deltas, alerts, routing log; **`write_handover_note`** persists structured text to IndexedDB. Show tool steps in UI if exposed, then open the saved note.

**Integrations.** **Emergency** can **POST** JSON to a user-configured HTTPS proxy when the proxy URL and caregiver phone are set; your server handles SMS, voice, or paging.

**Differentiation.** Accessibility-first UI, honest failure surfaces, streaming interpretation UX, dictionary-grounded prompts (`GROUNDING.md`), and documentation that **matches** the runtime (README “Implementation status”, `docs/`).

**Special Technology (optional).** Strong fit for **Ollama** prize; **Cactus**-style narrative = local-first PWA + **multi-tier model routing** (`docs/MODEL_ROUTING.md`). Only claim **LiteRT / llama.cpp / Unsloth** if the repo contains verifiable integration or fine-tunes.

**Repo / license.** MIT + `NOTICE`; see `docs/LICENSE_NOTES.md` for informational note on **hackathon winner CC-BY** obligations vs this repo license.

*(Target length for forms: trim to 200–400 words as required; expand from this source file as needed.)*
