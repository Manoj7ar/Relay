# Relay documentation

Index of technical and competition docs for the Relay repository.

## Start here

| Audience | Document |
|----------|----------|
| **Judges / first run** | [Repository README](../README.md) — setup, hackathon quickstart, implementation status |
| **Code orientation** | [SOURCE_LAYOUT.md](./SOURCE_LAYOUT.md) — `src/` folder map |

## Technical reference

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | UI, hooks, contexts, services, persistence, browser limits |
| [GEMMA_AND_INTEGRATIONS.md](./GEMMA_AND_INTEGRATIONS.md) | Ollama `/api/generate`, bilingual JSON, handover pipeline, JSON side tasks |
| [MODEL_ROUTING.md](./MODEL_ROUTING.md) | Deterministic E2B / E4B / 27B routing (`chooseModel`) |
| [GROUNDING.md](./GROUNDING.md) | Dictionary injection + handover client tools |
| [LATENCY_AND_METRICS.md](./LATENCY_AND_METRICS.md) | `latencyMs` meaning, how to measure, reference results tables |
| [SECURITY.md](./SECURITY.md) | Trust boundaries, CSP, env vars, no repo secrets |
| [LICENSE_NOTES.md](./LICENSE_NOTES.md) | MIT + hackathon winner license note (informational) |

## Canonical truth

If documents disagree, prefer in order:

1. [Repository README](../README.md) — **Implementation status** table  
2. [GEMMA_AND_INTEGRATIONS.md](./GEMMA_AND_INTEGRATIONS.md) + [ARCHITECTURE.md](./ARCHITECTURE.md)  
3. Source files cited in those docs (e.g. `HandoverAgent.ts`, `GemmaInterpreterAdapter.ts`)

**Handover:** client-side tools + **one** `POST /api/generate` — **not** remote Ollama `/api/chat` tool calling.

## Quick commands

```bash
npm install
ollama serve
ollama pull gemma4:e2b && ollama pull gemma4:e4b && ollama pull gemma4:27b
npm run dev
```

Optional: `npm run local-stt` + `VITE_RELAY_LOCAL_STT_URL` in `.env.local` when browser STT is blocked.
