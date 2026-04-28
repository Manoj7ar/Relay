# Hackathon positioning (Gemma 4 Good)

Short copy block for **Kaggle writeup**, **video script**, and **README** alignment. Tune word counts to competition limits (writeup ≤ 1,500 words).

## One-sentence wedge

Relay pairs **browser-native speech** with **local Gemma 4 via Ollama** so disfluent or fragmented speech can become a **clear, caregiver-ready phrase**—**without cloud inference** for the core interpret path—with **honest errors** when the model is unreachable.

## Impact Track (Kaggle)

| Track | How Relay maps (one sentence each) |
|-------|-----------------------------------|
| **Health & Sciences (primary)** | Communication access for ALS, stroke, Parkinson’s, and related conditions; caregiver-visible history and urgency-aware flows. |
| **Digital Equity & Inclusivity (secondary)** | Bilingual patient/caregiver routing, RTL, large touch targets, Web Speech where available with typed fallback. |
| **Safety & Trust** | Client-side **urgency guard** so clear emergency phrasing is not downgraded; **no mock inference** when Ollama is offline. |

## Special Technology angles (verify eligibility text on Kaggle before submit)

| Prize | Honest claim |
|-------|----------------|
| **Ollama** | Primary: real **`/api/generate`** streaming + JSON interpretation + optional `images[]`; documented in repo and [GEMMA_AND_INTEGRATIONS.md](./GEMMA_AND_INTEGRATIONS.md). |
| **Cactus** | Narrative: **local-first PWA** + **deterministic multi-model routing** (E2B / E4B / 27B) in [`modelRouter.ts`](../src/services/modelRouter.ts) — see [MODEL_ROUTING.md](./MODEL_ROUTING.md). This is **not** a claim to integrate a separate SDK unless you add one. |
| **LiteRT / llama.cpp / Unsloth** | Only claim if you ship **verifiable** integration or fine-tuned weights per prize definitions. |

## Multimodal demo beat (~20 seconds of script)

1. Open Home, enable **camera**, capture context.  
2. Speak a short phrase that benefits from visual context.  
3. Show routing log or UI indicating **27B** / `vision+speech` path.  
4. Read interpretation + optional TTS.

## Handover / agent demo beat (~30 seconds of script)

1. Open **Caregiver** → generate or refresh **Handover** using the agent.  
2. Show Ollama **`/api/chat`** tool steps (if your UI exposes them) or routing log lines.  
3. Open persisted note in UI — stored in **IndexedDB** via `write_handover_note` tool path.

## Official links to bookmark

- [Gemma 4 Good Hackathon (Kaggle)](https://www.kaggle.com/competitions/gemma-4-good-hackathon) — rules, deadlines, submission checklist.  
- [Google AI Gemma](https://ai.google.dev/gemma) — model family documentation and naming references (confirm current Gemma 4 asset naming before final video).
