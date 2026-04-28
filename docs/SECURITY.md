# Security notes

Relay is a **static client-side PWA**: there is no Relay-owned backend in this repository. Security posture is mostly **browser + user-chosen endpoints**.

## Secrets and configuration

- **No API keys** are embedded in the repo. Ollama base URL, model tags, emergency proxy URL, and caregiver phone live in **browser localStorage** via Settings (user-controlled).
- **Do not commit** personal `localStorage` dumps or `.env` files with real phone numbers into public forks.

## Ollama and emergency proxy trust

- **Ollama:** whoever controls the configured URL receives **transcripts and optional camera frames** as part of inference. Use HTTPS and a host you trust; see [GEMMA_AND_INTEGRATIONS.md](./GEMMA_AND_INTEGRATIONS.md#ollama-wire-protocol-what-judges-can-grep) for CORS and mixed-content caveats.
- **Emergency proxy:** when enabled, the browser **POST**s JSON to your proxy. Treat that like any **health-adjacent** integration: TLS, authentication, retention, and consent are your responsibility (see README “Integrations and safety”).

## Content Security Policy (CSP)

For production hosting (nginx, Cloudflare, Vercel static, GitHub Pages behind a proxy), consider a **restrictive** CSP. Exact directives depend on your host (inline scripts, service worker). A conservative starting point for discussion:

- `default-src 'self';`
- `connect-src 'self' https://YOUR_OLLAMA_HOST wss://...` (enumerate Ollama origins you allow)
- `img-src 'self' data: blob:;`
- `media-src 'self' blob:;`
- `worker-src 'self';` (PWA / service worker)

**Note:** Vite dev uses inline module scripts; a dev-tight CSP differs from production. Hash or nonce `script-src` if you inline anything in production builds.

## Dependency updates

Run `npm audit` periodically; pin major upgrades intentionally so the PWA stays reproducible for judges.
