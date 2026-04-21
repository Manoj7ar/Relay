# Relay

Mobile-first PWA voice accessibility assistant for people with speech
impairments (ALS, stroke aphasia, dysarthria, Parkinson's, etc.). Relay
interprets degraded speech, confirms with the user, and speaks it back in
their own voice — optionally triggering smart-home actions or emergency
flows.

> This repository ships the production-quality **frontend prototype**. All
> model / network boundaries are clean and typed, with mocks behind them
> (look for `TODO` comments). The real backends (Gemma 4 / Ollama,
> Cactus router, Unsloth fine-tune, Twilio, SmartThings) plug in behind
> the services in [`src/services`](src/services).

## Features

- **Patient home** (`/`) — streaming transcription card, confidence +
  mood + urgency indicators, primary/alternate interpretations,
  bilingual output with RTL support, camera toggle, quick phrases
  (time-of-day aware), 12-tile symbol board overlay, emergency
  detection with 5-second cancellable countdown.
- **Caregiver** (`/caregiver`) — today's interactions, model routing log,
  emergency timeline, one-click handover-note generator with copy.
- **Settings** (`/settings`) — voice-banking wizard, accessibility
  (high-contrast AAA + larger text), SmartThings + Twilio integration
  fields, language & RTL, offline status, Unsloth personalization
  metrics, routing log.
- **Demo** (`/demo`) — 4 scripted scenarios (Breakfast, Toilet, Cold,
  Arabic respiratory emergency with RTL + HIGH urgency) so judges can
  experience the full loop without local models.

## Tech

- Vite + React 18 + TypeScript (strict).
- Tailwind CSS v3 + CSS variables for the glass / grey palette.
- React Router v6.
- `vite-plugin-pwa` (Workbox) for installable offline shell.
- `lucide-react` icons.
- Pure React Context + `useReducer`, persisted to `localStorage`.

## Getting started

```bash
npm install
npm run dev         # http://localhost:5173
```

```bash
npm run build       # type-check + production build with service worker
npm run preview     # serve the built app locally
npm run typecheck
```

Tested with Node 20+ / 22.

### Installing on a phone

1. `npm run build && npm run preview -- --host`
2. Open the shown URL on your phone (same LAN).
3. In iOS Safari: Share → Add to Home Screen. In Android Chrome: the
   install prompt appears automatically.

Offline-first: after the first visit, the app shell (HTML/CSS/JS and
icons) stays available without network.

## Integration points

These are the typed seams where real backends plug in:

| Concern                      | File                                         | Notes                                             |
| ---------------------------- | -------------------------------------------- | ------------------------------------------------- |
| Gemma 4 / Ollama inference   | `src/services/modelRouter.ts`                | `inferE2B`, `inferE4B`, `infer27B`                |
| Cactus model routing         | `src/services/modelRouter.ts#chooseModel`    | Rule-based today, replace with Cactus API         |
| Unsloth fine-tune metrics    | `src/contexts/FineTuningContext.tsx`         | Drives Settings / Personalization panel           |
| Microphone / STT             | `src/services/speech.ts`                     | Swap in `SpeechRecognition` or server STT         |
| Voice synthesis (voice bank) | `src/services/speech.ts#speak`               | Wire to `SpeechSynthesis` or cloned voice model   |
| Camera context               | `src/services/camera.ts`                     | Replace with `getUserMedia`                       |
| Emergency (Twilio)           | `src/services/emergency.ts`                  | Replace with a tiny server proxy                  |
| SmartThings                  | `src/services/smartthings.ts`                | Replace with SmartThings REST API                 |

## Project layout

```
src/
  components/
    primitives/     Reusable UI primitives (Card, PillButton, Toggle, …)
    patient/        Patient home widgets
    caregiver/      Caregiver views
    settings/       Settings panels
    demo/           Demo mode widgets
  contexts/         Session, ModelRouting, Settings, FineTuning
  hooks/            useStreamingText, useCountdown, useOnlineStatus, useHaptics, useRTL
  lib/              cn, storage, time, id helpers
  pages/            PatientHomePage, CaregiverPage, SettingsPage, DemoPage
  services/         Mocked model/backend boundaries (typed)
  types/            model, session, settings, symbol
```

## Accessibility

- 80px minimum tap targets for primary controls.
- `prefers-reduced-motion` disables streaming animations.
- `data-contrast="high"` flips the palette to WCAG AAA black/white.
- Live regions: `aria-live="polite"` on transcription, `"assertive"` on
  the emergency banner.
- RTL handled at the layout level via the `dir` attribute and detected
  language.

## Notes on the build

This repo uses `vite-plugin-pwa` with Workbox. If your CI runs in a
sandbox that blocks Node worker threads you may need to allow
`worker_threads` for the final SW minification step; dev builds work
anywhere.
