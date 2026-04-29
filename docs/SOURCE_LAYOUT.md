# Source layout (`src/`)

This is the **orientation map** for judges and contributors. Paths are relative to `src/`.

## Entry

| Path | Role |
|------|------|
| `main.tsx` | React root, providers (`Settings`, `ModelRouting`, `Session`), PWA service worker registration. |
| `App.tsx` | Routes: onboarding gate, then `AppLayout` + nested routes for Home, Caregiver, Settings, About. |
| `index.css` | Global styles and design tokens (Tailwind layers). |

## UI by domain

| Folder | Role |
|--------|------|
| `components/patient/` | Home experience: mic, transcript card, camera, symbols, language. |
| `components/caregiver/` | Shift views: history, routing log, handover, dictionary panel, timelines. |
| `components/settings/` | Settings panels + `SettingsShell` layout primitives. |
| `pages/caregiver/` | Caregiver hub, nested route pages (`caregiverSubpages.tsx`), `CaregiverLayout`; shell in `components/caregiver/CaregiverShell.tsx`. |
| `pages/settings/` | Settings hub, nested route pages (`settingsSubpages.tsx`), `SettingsLayout`. |
| `components/about/` | About / architecture explainer (`AboutArchitectureContent`). |
| `components/onboarding/` | First-run steps and shell. |
| `components/dictionary/` | Shared dictionary entry modals/forms. |
| `components/layout/` | `RoutedViews` and other layout wrappers. |
| `components/primitives/` | Reusable UI: `Card`, `PillButton`, `Modal`, `Toggle`, etc. (`index.ts` barrel). |

## State and data

| Folder | Role |
|--------|------|
| `contexts/` | `SettingsContext`, `SessionContext`, `ModelRoutingContext` — app-wide state. |
| `lib/` | Pure helpers: `bilingualHero`, `patientDictionary`, `ollamaUrl`, `urgencyGuard`, storage, IDs, RTL helpers. |
| `types/` | Shared TypeScript types (`model`, `session`, `dictionary`, `settings`, …). |

## Services (I/O and side effects)

| Folder | Role |
|--------|------|
| `services/` | Browser capabilities: audio, camera, STT, TTS, permissions. |
| `services/interpretationService.ts` | Single `interpret()` entry; delegates to Gemma adapter. |
| `services/interpretation/` | `GemmaInterpreterAdapter`, `HandoverAgent`, `modelRouter`, `tools/` registry. |

## Hooks

| Folder | Role |
|--------|------|
| `hooks/` | Thin React hooks over services: mic, camera, speech, RTL, Ollama status, viewport, haptics. |

## Pages

| Folder | Role |
|--------|------|
| `pages/` | Route-level screens composing components above. |

## Conventions

- **Imports:** use `@/` alias to `src/` (see `tsconfig.json` `paths`).
- **Components:** PascalCase file names; colocate one main component per file unless tiny helpers are private.
- **Strict TypeScript:** `noUnusedLocals` / `noUnusedParameters` enabled — avoid unused bindings.

For architecture narrative and browser limits, see [ARCHITECTURE.md](./ARCHITECTURE.md). For Gemma/Ollama, see [GEMMA_AND_INTEGRATIONS.md](./GEMMA_AND_INTEGRATIONS.md).
