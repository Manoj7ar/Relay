/**
 * Optional **local** speech-to-text sidecar (offline CLI or HTTP service you control).
 *
 * Browser Web Speech (`SpeechRecognition`) often uses a **separate** cloud service
 * from your LLM (Ollama). If that path returns `network`, Relay can still
 * capture mic audio here and POST it to your own STT server.
 *
 * Configure `VITE_RELAY_LOCAL_STT_URL` (e.g. `http://127.0.0.1:9000`). Reference sidecar:
 * `npm run local-stt` → `scripts/local-stt-server.mjs`. Relay calls:
 *
 *   `POST {base}/transcribe`
 *   `multipart/form-data`: field `audio` (Blob), optional `language` (BCP-47)
 *   JSON body: `{ "text": "..." }` or `{ "transcript": "..." }`
 */

export function isLocalSttConfigured(): boolean {
  return Boolean(String(import.meta.env.VITE_RELAY_LOCAL_STT_URL ?? '').trim());
}

export class LocalSttError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'LocalSttError';
    this.status = status;
  }
}

function baseUrl(): string {
  const raw = String(import.meta.env.VITE_RELAY_LOCAL_STT_URL ?? '').trim();
  return raw.replace(/\/$/, '');
}

export async function transcribeWithLocalStt(
  audio: Blob,
  language: string,
): Promise<string> {
  const base = baseUrl();
  if (!base) {
    throw new LocalSttError('VITE_RELAY_LOCAL_STT_URL is not set');
  }
  const form = new FormData();
  form.append('audio', audio, 'relay-clip.webm');
  form.append('language', language);

  const res = await fetch(`${base}/transcribe`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new LocalSttError(
      detail.trim() || `Local STT failed (${res.status})`,
      res.status,
    );
  }
  const data = (await res.json().catch(() => null)) as {
    text?: string;
    transcript?: string;
  } | null;
  const text = (data?.text ?? data?.transcript ?? '').trim();
  return text;
}
