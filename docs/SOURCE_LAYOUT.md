# Source layout (`src/`)

This is the **orientation map** for judges and contributors. Paths are relative to `src/`.

## Entry

| Path | Role |
|------|------|
| `main.tsx` | React root, providers (`Settings`, `ModelRouting`, `Session`), PWA service worker registration. |
| `App.tsx` | Routes: onboarding gate, then `AppLayout` + nested routes for Home, Caregiver, Settings, About. Supports `?reset-onboarding=1`. |
| `index.css` | Global styles and design tokens (Tailwind layers). |

## UI by domain

| Folder | Role |
|--------|------|
| `components/patient/` | Home experience: mic, transcript card, camera, symbols, language, predictive chips. |
| `components/caregiver/` | Shift views: history, routing log, handover timeline, dictionary panel, session insight. |
| `components/settings/` | Settings panels + `SettingsShell`; `ModelConfigPanel` (Ollama URL, test, tier tags). |
| `pages/caregiver/` | Caregiver hub, nested route pages (`caregiverSubpages.tsx`), `CaregiverLayout`. |
| `pages/settings/` | Settings hub, nested route pages (`settingsSubpages.tsx`), `SettingsLayout`. |
| `components/about/` | About / architecture explainer (`AboutArchitectureContent`). |
| `components/onboarding/` | First-run steps and shell. |
| `components/dictionary/` | Shared dictionary entry modals/forms. |
| `components/layout/` | `RoutedViews` and other layout wrappers. |
| `components/primitives/` | Reusable UI: `Card`, `PillButton`, `Modal`, `Toggle`, etc. (`index.ts` barrel). |

## State and data

| Folder / file | Role |
|---------------|------|
| `contexts/SettingsContext.tsx` | Persisted settings (`relay.settings`), including `SET_OLLAMA_BASE_URL`. |
| `contexts/SessionContext.tsx` | Live session, `submit()` → `interpret()`, history (`relay.session.history`). |
| `contexts/ModelRoutingContext.tsx` | Routing log (`relay.routing.log`). |
| `lib/bilingualHero.ts` | Listener-facing hero text + TTS language from bilingual model output. |
| `lib/transcriptSpeakerHint.ts` | STT locale hints from inferred speaker (not biometrics). |
| `lib/conversationContext.ts` | Formats recent lines for model conversation tail. |
| `lib/patientDictionary.ts` | IndexedDB `relay_patient_dictionary`. |
| `lib/handoverNotes.ts` | IndexedDB `relay_handover_notes`. |
| `lib/voiceSamples.ts` | IndexedDB `relay-voice` audio blobs. |
| `lib/fineTuneExport.ts` | JSONL export from history + dictionary. |
| `lib/ollamaUrl.ts` | `getResolvedOllamaBaseUrl()`, normalize URL. |
| `lib/ollamaModelConfig.ts` | Default tags + `relay.model.*` overrides. |
| `lib/urgencyGuard.ts` | Post-model urgency clamp for emergency phrases. |
| `lib/storage.ts` | Typed localStorage helpers. |
| `types/` | Shared TypeScript types (`model`, `session`, `dictionary`, `handover`, `settings`, …). |

## Services (I/O and side effects)

| Path | Role |
|------|------|
| `services/audioCaptureService.ts` | Mic stream + RMS. |
| `services/speechRecognitionService.ts` | Web Speech API wrapper. |
| `services/localSttService.ts` | Optional sidecar POST (`VITE_RELAY_LOCAL_STT_URL`). |
| `services/speechSynthesisService.ts` | TTS. |
| `services/cameraService.ts` | Camera preview + frame capture. |
| `services/permissionsService.ts` | Permission queries and errors. |
| `services/interpretationService.ts` | Single `interpret()` entry. |
| `services/modelRouter.ts` | `chooseModel`, `logEntryFromInterpretation`. |
| `services/onboardingDictionarySeeder.ts` | Post-onboarding dictionary seed. |
| `services/caregiver/sessionInsight.ts` | Shift insight card (Ollama JSON). |
| `services/interpretation/GemmaInterpreterAdapter.ts` | Streaming `/api/generate` interpretation. |
| `services/interpretation/ollamaJson.ts` | Non-streaming JSON tasks. |
| `services/interpretation/HandoverAgent.ts` | Handover pipeline. |
| `services/interpretation/predictivePhrases.ts` | Home predictive chips. |
| `services/interpretation/bilingualCoach.ts` | Bilingual coaching copy. |
| `services/interpretation/localTranscription.ts` | Local transcription helper (sidecar path). |
| `services/interpretation/tools/` | Handover data tools + `writeHandoverNote`, `registry.ts`. |

## Hooks

| Path | Role |
|------|------|
| `hooks/useMicrophone.ts` | Mic level + stream lifecycle. |
| `hooks/useSpeechRecognition.ts` | STT state machine. |
| `hooks/useSpeechSynthesis.ts` | TTS speak/stop. |
| `hooks/useCamera.ts` | Camera + frame for interpret. |
| `hooks/usePermissions.ts` | Permission UX. |
| `hooks/usePredictivePhrases.ts` | Predictive phrase fetch. |
| `hooks/useOllamaStatus.ts` | Connectivity hints. |
| `hooks/useRtl.ts`, `useViewport.ts`, `useHaptics.ts` | UX polish. |

## Pages

| Path | Role |
|------|------|
| `pages/PatientHomePage.tsx` | Main patient capture UI (`/`). |
| `pages/OnboardingPage.tsx` | First-run flow. |
| `pages/AboutPage.tsx` | Architecture summary. |
| `pages/caregiver/*` | Caregiver hub and sub-routes. |
| `pages/settings/*` | Settings hub and sub-routes (`/settings/models`, etc.). |

## Scripts (repo root, not under `src/`)

| Path | Role |
|------|------|
| `scripts/local-stt-server.mjs` | Reference STT sidecar (`npm run local-stt`). |
| `scripts/gen-relay-languages.mjs` | Regenerates `lib/relayLanguages.generated.ts`. |

## Conventions

- **Imports:** use `@/` alias to `src/` (see `tsconfig.json` `paths`).
- **Components:** PascalCase file names; colocate one main component per file unless tiny helpers are private.
- **Strict TypeScript:** `noUnusedLocals` / `noUnusedParameters` enabled — avoid unused bindings.

For architecture narrative and browser limits, see [ARCHITECTURE.md](./ARCHITECTURE.md). For Gemma/Ollama, see [GEMMA_AND_INTEGRATIONS.md](./GEMMA_AND_INTEGRATIONS.md).
