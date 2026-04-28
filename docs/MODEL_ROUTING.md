# Model routing (E2B / E4B / 27B)

Relay uses **deterministic** routing: the same `InferenceRequest` shape always maps to the same **tier** (`E2B`, `E4B`, or `27B`). There is **no** LLM inside the router—only `chooseModel` in [`src/services/modelRouter.ts`](../src/services/modelRouter.ts). The tier selects which **Ollama tag** to call (from Settings / `localStorage`, with defaults in `GemmaInterpreterAdapter`).

This matches hackathon narratives for **local-first mobile** plus **intelligent routing between models** (e.g. Special Technology “Cactus” prize: route tasks between models on the device path). Relay does not require a separate product SDK named “Cactus”; the policy is plain TypeScript and is easy for judges to verify in the repo.

## Decision table

| Condition (first match wins) | Tier | Typical reason string |
|------------------------------|------|------------------------|
| `compound` input (multiple non-time channels) | **27B** | Concurrent signals → multimodal fusion. |
| `visionOn` or `inputType === 'vision+speech'` | **27B** | Camera + speech → multimodal reasoning. |
| `urgencyHint === 'HIGH'` | **27B** | High urgency hint → reasoning model. |
| `inputType === 'symbols'` | **E4B** | Symbol input → fine-tuned phrase expansion. |
| `inputType === 'text'` | **E2B** | Text shortcut → real-time inference. |
| Default (short speech) | **E2B** | Short speech → real-time inference. |

`InferenceRequest` is built in [`GemmaInterpreterAdapter`](../src/services/interpretation/GemmaInterpreterAdapter.ts) from `InterpretationInput` (including `visionOn`, `transcript`, symbols, etc.).

## Trade-offs (for writeups and demos)

- **E2B** — Lower latency target for typed text and simple speech; good default for responsiveness.
- **E4B** — Used for symbol-board style input where phrase expansion is emphasized in product narrative.
- **27B** — Reserved for **multimodal** (camera frame), **compound** channels, and **HIGH** urgency hints where the stack steers toward a heavier model tag.

## Extending the router

Swap `chooseModel` for a learned or telemetry-driven router (e.g. future Cactus-style integration) without changing UI contracts: `Interpretation.model` and the routing log still consume `{ model, reason }`.

See also [GEMMA_AND_INTEGRATIONS.md](./GEMMA_AND_INTEGRATIONS.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).
