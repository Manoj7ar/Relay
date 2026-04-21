# Relay — architecture overview

Relay is a mobile-first PWA with a clean separation between:

1. **Real browser capability layer** — permissions, mic capture, STT, TTS, camera.
2. **Thin routing policy** — `chooseModel(req)` picks E2B / E4B / 27B.
3. **Single interpretation entry point** — `interpret(input)` delegated to one adapter.

There is no demo mode, no scripted scenarios, no fake answer dictionary. Everything that looks like AI output is produced by the adapter; the adapter is the one file you implement.

## Layer diagram

```mermaid
flowchart TB
  subgraph ui [UI layer]
    Pages[pages]
    Components[components]
    TypeSheet[TypeInsteadSheet]
    CamPreview[CameraPreview]
    Replay[Replay / StopSpeaking]
  end
  subgraph hooks [React hooks]
    usePerm[usePermissions]
    useMic[useMicrophone]
    useSTT[useSpeechRecognition]
    useTTS[useSpeechSynthesis]
    useCam[useCamera]
  end
  subgraph state [State layer]
    Session[SessionContext]
    RoutingCtx[ModelRoutingContext]
    Settings[SettingsContext]
  end
  subgraph interp [Interpretation layer]
    ISvc[interpretationService.interpret]
    GemmaAdapter[GemmaInterpreterAdapter]
  end
  subgraph browser [Browser capability services]
    PermSvc[permissionsService]
    AudioSvc[audioCaptureService]
    STTSvc[speechRecognitionService]
    TTSSvc[speechSynthesisService]
    CamSvc[cameraService]
  end
  subgraph routing [Routing policy]
    Router[modelRouter.chooseModel]
  end
  subgraph integrations [Integration stubs]
    Emergency[emergency]
    ST[smartthings]
    Twilio[twilio]
  end

  Pages --> Session
  Components --> Session
  Components --> hooks
  hooks --> browser
  Session --> ISvc
  ISvc --> GemmaAdapter
  GemmaAdapter --> Router
  Session --> RoutingCtx
  Settings --> Session
  Session --> Emergency
```

## UI layer (`src/pages`, `src/components`)

- **Pages**: `PatientHomePage`, `CaregiverPage`, `SettingsPage`, `AboutPage`.
- **Primitives**: reusable glass-style controls (`Card`, `PillButton`, `Modal`, etc.).
- **Domain components**: `patient/`, `caregiver/`, `settings/`.

Every input surface (mic + STT, `TypeInsteadSheet`, `QuickPhrases`, `SymbolBoardOverlay`, `CameraPreview` frame capture) funnels into `SessionContext.submit` → `interpret()`.

## Hooks (`src/hooks`)

Typed wrappers around the browser capability services with lifecycle-safe cleanup:

| Hook | Wraps |
|------|-------|
| `usePermissions(kind)` | `permissionsService` |
| `useMicrophone` | `audioCaptureService` |
| `useSpeechRecognition` | `speechRecognitionService` |
| `useSpeechSynthesis` | `speechSynthesisService` |
| `useCamera` | `cameraService` |

All browser API access lives inside these services; UI consumes typed state only.

## State layer (`src/contexts`)

| Context | Responsibility |
|---------|----------------|
| `SessionContext` | Listening/processing flags, interim transcript, current interpretation, pending camera frame, history, vision toggle, language/direction, `lastError` surface for "not connected" states |
| `ModelRoutingContext` | Current model id, append-only routing log (persisted) |
| `SettingsContext` | Accessibility, integrations, language |

## Interpretation layer (`src/services/interpretationService.ts`)

Single entry point: `interpret(input)`. Internally it calls exactly one adapter — `GemmaInterpreterAdapter` — whose body is the one thing you implement.

The returned `InterpretationResult` shape is aligned to Gemma's eventual output:
`primaryText`, `alternates`, `confidence`, `urgency`, `detectedLanguage`, `mood`, `sourceModel`, `sourceType`, `routingReason`, `latencyMs`, `visionUsed`, `sourceFragment`.

Until wired, `GemmaInterpreterAdapter.interpret` throws `GemmaNotConnectedError`; `SessionContext` surfaces that as `state.lastError` and the `TranscriptionCard` renders a dismissible notice. No fake answers ever reach the UI.

## Routing policy (`src/services/modelRouter.ts`)

Pure, deterministic `chooseModel(req)`. No inference here — the adapter calls this (or substitutes a learned router) before hitting Gemma. Kept as a stable interface so swapping to Cactus is a one-file change.

Also exports `logEntryFromInterpretation` used by `ModelRoutingContext` to populate the routing log once real results arrive.

## Browser capability services (`src/services/*Service.ts`)

| Service | Browser API |
|---------|-------------|
| `permissionsService` | `navigator.permissions`, `getUserMedia` error classification |
| `audioCaptureService` | `getUserMedia({ audio })`, `AnalyserNode` RMS level |
| `speechRecognitionService` | `SpeechRecognition` / `webkitSpeechRecognition` |
| `speechSynthesisService` | `window.speechSynthesis` |
| `cameraService` | `getUserMedia({ video })`, `<video>` + `<canvas>` for frame capture |

## Integration stubs (`src/services`)

Typed boundaries that currently throw `*NotConnectedError` so the UI shows an honest "not configured" state:

- `emergency.ts` — Twilio Voice/SMS emergency dispatch.
- `twilio.ts` — Test SMS from Settings → Integrations.
- `smartthings.ts` — Smart-home scene runner.

## Persistence

- `localStorage` keys prefixed with `relay.*` (session history, settings, routing log).

## Browser capability caveats

- **iOS Safari**: `SpeechRecognition` is partially supported on 14.5+; some versions return `not-allowed` unless served over HTTPS.
- **Firefox desktop**: `SpeechRecognition` not implemented — the Type-instead sheet is the primary input.
- **Android Chrome**: Most complete path; supports continuous STT, full TTS voice list.
- **All browsers**: `speechSynthesis.getVoices()` is async; the service resolves after `voiceschanged`.

## Wired vs stub today

| Flow | Today | Plug-in point |
|------|-------|---------------|
| Mic permission + capture | Real `getUserMedia` + analyser level | — |
| Speech-to-text | Real Web Speech API where supported | `speechRecognitionService` |
| Text-to-speech | Real `speechSynthesis` | — |
| Camera preview + frame capture | Real `getUserMedia({ video })`; frame stored on session | Fed into `interpret()` as `imageDataUrl` |
| Routing decision | Real `chooseModel` | Swap to Cactus if desired |
| Interpretation | Stub — throws `GemmaNotConnectedError` | `GemmaInterpreterAdapter.interpret` |
| Emergency escalation | In-app countdown + stub service | `services/emergency.ts` |
| Twilio SMS | Stub | `services/twilio.ts` |
| SmartThings | Stub | `services/smartthings.ts` |

For the Gemma wiring checklist, see [GEMMA_AND_INTEGRATIONS.md](./GEMMA_AND_INTEGRATIONS.md).
