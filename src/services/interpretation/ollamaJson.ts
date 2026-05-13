/**
 * Non-streaming JSON helper backed by local Ollama.
 *
 * Mirrors the streaming pattern in `GemmaInterpreterAdapter.callOllamaStreaming`
 * but for short structured side-tasks (predictive phrases, bilingual coach,
 * session insight, handover note). Calls
 *   POST {ollamaBase}/api/generate
 * with `stream: false` and `format: 'json'` so the response body is a single
 * JSON object whose `response` field is the raw model JSON string.
 *
 * Throws `GemmaNotConnectedError` on network / non-2xx — keeps the same error
 * surface used by the streaming interpretation path so the UI can recover.
 */

import { getOllamaModelTagForTier } from '@/lib/ollamaModelConfig';
import { getResolvedOllamaBaseUrl } from '@/lib/ollamaUrl';
import type { ModelId } from '@/types/model';
import { GemmaNotConnectedError } from './GemmaInterpreterAdapter';

const REQUEST_TIMEOUT_MS = 30_000;

type OllamaTier = Exclude<ModelId, never>;

interface OllamaGenerateResponse {
  response?: string;
  error?: string;
}

interface CompleteOllamaJsonOptions<T> {
  prompt: string;
  parse: (raw: string) => T;
  tier?: OllamaTier;
  modelTag?: string;
  temperature?: number;
  numPredict?: number;
}

/**
 * Strip ```json fences and parse the first JSON object found in `raw`. Throws
 * `GemmaNotConnectedError` if no parseable object is present.
 */
export function parseOllamaJsonObject<T = unknown>(raw: string): T {
  const clean = raw
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start < 0 || end <= start) {
    throw new GemmaNotConnectedError(
      getResolvedOllamaBaseUrl(),
      'Model did not return a JSON object.',
    );
  }
  try {
    return JSON.parse(clean.slice(start, end + 1)) as T;
  } catch {
    throw new GemmaNotConnectedError(
      getResolvedOllamaBaseUrl(),
      'Invalid JSON in model response.',
    );
  }
}

export async function completeOllamaJsonTask<T>(
  options: CompleteOllamaJsonOptions<T>,
): Promise<T> {
  const ollamaBase = getResolvedOllamaBaseUrl();
  const model =
    options.modelTag ??
    getOllamaModelTagForTier(options.tier ?? 'E2B');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${ollamaBase}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        prompt: options.prompt,
        stream: false,
        format: 'json',
        options: {
          temperature: options.temperature ?? 0.2,
          num_predict: options.numPredict ?? 400,
        },
      }),
    });
  } catch (err) {
    clearTimeout(timeoutId);
    throw new GemmaNotConnectedError(
      ollamaBase,
      err instanceof Error ? err.message : undefined,
    );
  }

  clearTimeout(timeoutId);

  if (!res.ok) {
    throw new GemmaNotConnectedError(ollamaBase, `HTTP ${res.status}`);
  }

  let body: OllamaGenerateResponse;
  try {
    body = (await res.json()) as OllamaGenerateResponse;
  } catch (err) {
    throw new GemmaNotConnectedError(
      ollamaBase,
      err instanceof Error ? err.message : 'Could not read Ollama response.',
    );
  }

  if (body.error) {
    throw new GemmaNotConnectedError(ollamaBase, body.error);
  }

  const raw = (body.response ?? '').trim();
  if (!raw) {
    throw new GemmaNotConnectedError(ollamaBase, 'Empty response body.');
  }

  return options.parse(raw);
}
