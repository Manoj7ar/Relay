# Submission summary (Kaggle / hackathon form)

**Problem.** Millions of people live with speech that is fragmented, quiet, or inconsistent — from ALS, stroke, Parkinson’s, and related conditions. Everyday needs (food, comfort, bathroom, emergency) can be lost between the speaker and caregivers or devices.

**Solution.** **Relay** is a mobile-first PWA that captures **real** microphone input and **browser-native speech-to-text** (where supported), sends the transcript (plus optional camera frame) to a **local Ollama** endpoint for **Gemma-class** interpretation, shows a clear primary phrase with alternates, supports bilingual hints and RTL, and reads the result back with **real browser TTS**. There is **no** demo mode and **no** fake inference: if Ollama is unreachable, the user sees an explicit error — not a scripted answer.

**Impact.** The goal is to reduce communication friction: clearer intent for the speaker, better handover signals for caregivers, and client-side urgency guarding on top of model output for safety-sensitive wording.

**Gemma / Ollama.** Relay uses a **single adapter** (`GemmaInterpreterAdapter`) calling **`http://localhost:11434`**, tier names from **Settings → Models**, and deterministic **`chooseModel`** routing (E2B / E4B / 27B narrative). This is **real HTTP inference** when Ollama is running — not in-browser mock text.

**Integrations.** **Emergency** can **POST** JSON to a user-configured HTTPS proxy when the proxy URL and caregiver phone are set; your server handles SMS, voice, or paging.

**Differentiation.** Accessibility-first UI (touch, RTL, contrast), honest error surfaces, streaming interpretation UX, caregiver exports and routing filters, and documentation that **matches** the runtime (see README “Implementation status”).

*(Target length for forms: roughly 200–400 words; trim as needed.)*
