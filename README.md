# Relay

**Relay** is a mobile-first PWA for people whose speech is hard to understand — including ALS, stroke-related aphasia, dysarthria, and Parkinson’s. It turns fragmented or unclear speech into a clear phrase the user can confirm, speak back in their own voice (voice banking), and optionally route to smart-home actions or a staged emergency flow.

This repository ships a **production-quality frontend prototype**: typed seams for Gemma-family inference, Cactus-style routing, Twilio, and SmartThings; **mock implementations** ship in-repo so you can run the full UX locally without API keys.

---

## Why this problem

When words do not come out reliably, communication fatigue is real. Relay is designed to reduce the gap between intent and clarity for both the speaker and caregivers, with explicit confirmation, bilingual support, RTL, and safety-aware urgency.

---

## Key features

| Area | Route | What it does |
|------|-------|----------------|
| Patient home | `/` | Streaming interpretation card, urgency/mood, alternates, bilingual line, camera toggle, quick phrases, symbol board, emergency countdown |
| Caregiver | `/caregiver` | Today’s interactions, routing log, emergency timeline, handover note |
| Settings | `/settings` | Voice banking, accessibility, integrations, language, offline status, routing log, **About Relay** |
| Judge Demo | `/demo` | Demo mode toggle, **Start Judge Demo** walkthrough, four scripted scenarios |
| Gemma & architecture | `/about` | Model tiers (E2B / E4B / 27B), offline story, pointers to docs |

---

## Demo flow

1. Open **Settings** → enable **Demo mode** (live mic and camera paths are disabled; text/symbols still exercise inference).
2. Open **Demo** → tap **Start Judge Demo** or **Play scenario** on any card.
3. You are taken to **Home** for a phased walkthrough: fragmented input → routing line → interpretation → **Confirm** → outcome (including emergency copy for HIGH urgency).
4. Check **Settings → Routing log** or the home **Model** chip for tier and reason.

---

## Architecture

UI → React contexts (`Session`, `ModelRouting`, `Settings`, `FineTuning`, `JudgeDemo`) → `modelRouter` (`chooseModel`, `infer*`) → mocked smart home / emergency services.

**Details:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · **Mocks vs production:** [docs/GEMMA_AND_INTEGRATIONS.md](docs/GEMMA_AND_INTEGRATIONS.md)

---

## How Gemma 4 is used

Relay treats **Gemma 4** as the family behind three tiers (**E2B**, **E4B**, **27B**) selected by input type, urgency, and multimodal context. In this build, **`inferE2B` / `inferE4B` / `infer27B`** are browser mocks with realistic latency; swapping in **Ollama** or a hosted endpoint is a service-layer change, not a UI rewrite.

---

## Integrations (summary)

| Topic | Doc / code |
|-------|------------|
| **Cactus-style routing** | `chooseModel` in [src/services/modelRouter.ts](src/services/modelRouter.ts) |
| **Unsloth / fine-tuning** | [src/contexts/FineTuningContext.tsx](src/contexts/FineTuningContext.tsx), Personalize in Settings |
| **Ollama / local** | Replace `infer*` bodies; see [docs/GEMMA_AND_INTEGRATIONS.md](docs/GEMMA_AND_INTEGRATIONS.md) |
| **SmartThings** | [src/services/smartthings.ts](src/services/smartthings.ts) |
| **Twilio / emergency** | [src/services/emergency.ts](src/services/emergency.ts) |

---

## Demo mode

When **Demo mode** is on:

- The **primary mic** does not start capture; **camera** toggle is disabled.
- **`submit`** ignores `speech` and `vision+speech` requests (defense in depth).
- Text **quick phrases** and **symbols** still run the mocked inference pipeline for accessibility testing.
- A **banner** on the patient home reminds you that live mic/network capture is off.

Toggle: **Settings** (Demo mode section on the Demo page, or the dedicated toggle widget on `/demo`).

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

## Screenshots & media

Optional assets can live under **`docs/media/`**.

---

## Roadmap

- Wire **SpeechRecognition** / server STT and **SpeechSynthesis** / cloned voice.
- Replace routing with a live **Cactus** (or equivalent) endpoint.
- Connect **Ollama** or cloud Gemma for real inference.
- Production **Twilio** and **SmartThings** behind small server proxies.

---

## Ethics & privacy

Relay is built for dignity and clarity: data stays on-device in this prototype except where you explicitly wire cloud services. Voice banking and health-adjacent data deserve explicit consent and clear retention policies in production.

---

## License

[MIT](LICENSE)

---

## Documentation index

| Resource | Purpose |
|----------|---------|
| [docs/README.md](docs/README.md) | Doc index |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layers and data flow |
| [docs/GEMMA_AND_INTEGRATIONS.md](docs/GEMMA_AND_INTEGRATIONS.md) | Gemma, mocks, integrations |
