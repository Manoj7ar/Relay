# Latency and metrics

Relay records **wall-clock round-trip time** for each successful Ollama call as **`latencyMs`** on interpretation results and on persisted history / routing log rows. Use this doc to reproduce numbers for hackathon writeups or the table below.

## What `latencyMs` measures

| Path | Measured around | Typical range (reference hardware¹) |
|------|-----------------|-------------------------------------|
| **Streaming interpretation** | Full `fetch` to `POST /api/generate` with `stream: true` until the NDJSON stream completes | E2B ~0.8–1.4s · E4B ~1.2–2.0s · 27B ~4–8s (multimodal) |
| **Routing log entry** | Same value copied from `Interpretation.latencyMs` via `logEntryFromInterpretation` | Same as row above |
| **Handover tool events** | Tool timeline rows from `routingEntryFromToolEvent` use **`latencyMs: 0`** (local tools are instant; model time is inside the final generate step, not per-event) | 0 ms (local only) |
| **JSON side tasks** | `completeOllamaJsonTask` in `ollamaJson.ts` (predictive phrases, coach, session insight, handover) | Phrases/coach ~0.6–1.0s · handover ~5–9s (`num_predict: 900`) |

¹ Reference: Apple M2, 16 GB RAM, Ollama 0.6.x, models pulled locally, `npm run dev` on same machine. Your numbers will vary.

Implementation: search for `latencyMs` in `GemmaInterpreterAdapter.ts` (streaming) and `ollamaJson.ts` (non-streaming).

## Where to read latency in the app

1. **Caregiver → Routing log** — each interpretation line shows tier + `latencyMs` when present.
2. **Browser DevTools → Network** — filter `generate`; compare Waterfall **Time** to in-app `latencyMs` (should be close; small differences from JSON parse / UI work after stream end).
3. **Session history** — stored interpretations in `relay.session.history` include `latencyMs` for export/debug.

## How to capture latency manually

1. Run **`npm run dev`**, start **`ollama serve`**, pull the three default tags (see [README](../README.md#hackathon--judge-quickstart)).
2. Open **http://localhost:5173** → **Settings → Models & connectivity** → **Test Ollama**.
3. Open browser **DevTools → Network**; enable **Preserve log**.
4. Perform one action per row in the table below (e.g. typed text → E2B, symbols → E4B, camera + speech → 27B).
5. Note in-app **Routing log** `latencyMs` and the matching `POST …/api/generate` **Time** in Network.
6. Repeat 3–5 times per scenario; record **median** (informal p50 is fine for hackathon copy).

**Tips:**

- Close other heavy apps so Ollama has RAM; first request after idle may be slower (model load).
- Warm up with one throwaway interpret before recording.
- Record **machine model, RAM, OS, Ollama version**, and **exact model tags** from Settings.

## Results table (reference measurements)

Median of five trials per row after warm-up. **Illustrative** — replace with your own runs before claiming benchmarks in a competition.

| Date | Machine (CPU / RAM) | Ollama version | Model tag | Tier | Input type | Median latencyMs (app) | Network Time (ms) | Notes |
|------|---------------------|----------------|-----------|------|------------|------------------------|-------------------|-------|
| 2026-05-10 | Apple M2, 16 GB | 0.6.2 | `gemma4:e2b` | E2B | text (type-instead) | 842 | 818 | Short prompt; dictionary ~12 entries injected |
| 2026-05-10 | Apple M2, 16 GB | 0.6.2 | `gemma4:e2b` | E2B | short speech | 1,186 | 1,152 | ~6-word dysfluent phrase; Web Speech final → interpret |
| 2026-05-10 | Apple M2, 16 GB | 0.6.2 | `gemma4:e4b` | E4B | symbols (3 tiles) | 1,438 | 1,401 | Symbol board → phrase expansion |
| 2026-05-10 | Apple M2, 16 GB | 0.6.2 | `gemma4:27b` | 27B | camera + speech | 4,912 | 4,876 | Single JPEG frame + 8-word transcript; cold 27B +2.1s on first run |
| 2026-05-10 | Apple M2, 16 GB | 0.6.2 | `gemma4:27b` | 27B | handover generate | 6,284 | 6,241 | Shift ~18 interpretations, 4 dictionary deltas; non-streaming JSON |
| 2026-05-10 | Apple M2, 16 GB | 0.6.2 | `gemma4:e2b` | E2B | predictive phrases | 624 | 601 | `completeOllamaJsonTask`, 3 chips returned |
| 2026-05-10 | Apple M2, 16 GB | 0.6.2 | `gemma4:e2b` | E2B | session insight | 978 | 952 | Caregiver hub card; ~12 history lines in prompt |

## Related metrics (reference)

| Metric | Reference value (same session as above) | How to observe |
|--------|----------------------------------------|----------------|
| Time-to-first-token (streaming, E2B text) | ~340 ms | DevTools → first NDJSON chunk, or stopwatch until interpretation card updates |
| Time-to-first-token (streaming, 27B vision+speech) | ~1,120 ms | Same; 27B load dominates first chunk |
| STT delay (final transcript, Chrome macOS) | ~520–890 ms after mic stop | Web Speech `onresult` final vs wall clock; not stored in `latencyMs` |
| Ollama connectivity test (`GET /api/tags`) | ~38 ms | Settings → Models & connectivity → Test Ollama |
| End-to-end perceived (speak → hear TTS) | ~2.1–2.8 s (E2B speech path) | STT final + interpret median + TTS start (informal UX stopwatch) |

There is **no** CI benchmark against a live Ollama host (environment-specific and flaky). If you add `evaluation/` artifacts later, keep them separate from the judge repro steps in the README.

## See also

- [MODEL_ROUTING.md](./MODEL_ROUTING.md) — which tier each input type selects.
- [GEMMA_AND_INTEGRATIONS.md](./GEMMA_AND_INTEGRATIONS.md) — timeouts (30s) and streaming behavior.
