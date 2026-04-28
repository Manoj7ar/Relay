# Latency and metrics

Relay records **server-side (Ollama) round-trip time** for each successful interpretation as **`latencyMs`** on `InterpretationResult` and on persisted `Interpretation` / history rows. The routing log UI also surfaces model tier and latency for demos and verification.

## How to capture latency manually

1. Run **`npm run dev`**, ensure Ollama is healthy, open browser **DevTools → Network**.
2. Filter by **`generate`** (or your Ollama host).
3. Perform one mic or text interpretation; select the `POST .../api/generate` row and read **Time** (or Waterfall total) for a second opinion vs in-app `latencyMs`.
4. Compare with the **Routing log** on the Caregiver page (or wherever your build shows the logged line).

`latencyMs` is measured in the adapter as **elapsed wall time** around the streaming `fetch` (see `GemmaInterpreterAdapter`).

## Optional results table (fill before hackathon submit)

Replace the placeholder row with your reference hardware and rough p50 after a few trials (informal is fine).

| Date | Machine / CPU | Ollama tag (tier) | Input type | Approx. latency (ms) | Notes |
|------|----------------|-------------------|------------|----------------------|-------|
| _fill_ | _e.g. M1, 16GB_ | `gemma4:e2b` (E2B) | speech | | |
| | | | | | |

## What we do not automate in-repo

There is no CI benchmark against a live Ollama host (would be flaky and environment-specific). If you add `evaluation/` artifacts later, keep them separate from required judge repro steps in the README.
