/**
 * Real Gemma 4 interpretation adapter, backed by a local Ollama server.
 *
 * Wiring overview:
 *   1. `chooseModel` (from `../modelRouter`) picks an E2B / E4B / 27B tier
 *      based purely on the shape of the request.
 *   2. A compact prompt is built with patient context + known speech-pattern
 *      examples (dropped syllables, slurred consonants, multilingual inputs).
 *   3. We call `POST {ollamaBase}/api/generate` (base URL from Settings) with
 *      `stream: true`, `format: 'json'`, and (for multimodal) the captured
 *      camera frame as a base64 entry in `images[]`.
 *   4. NDJSON chunks are accumulated. A forgiving progressive extractor
 *      pulls the in-progress `"primaryText"` field out of the partial JSON
 *      and feeds it to `input.onStreamChunk` so the UI can animate the
 *      answer word-by-word — never exposing raw JSON.
 *   5. The final response is parsed defensively, then run through the
 *      client-side `applyUrgencyGuard` so a confused model can never
 *      downgrade a clear emergency phrase.
 *
 * If Ollama is unreachable, any network / non-2xx response raises
 * `GemmaNotConnectedError`. The rest of the app surfaces that as
 * `state.lastError` and keeps the UI honest.
 *
 * See docs/GEMMA_AND_INTEGRATIONS.md for the deployment checklist.
 */

import { uid } from '@/lib/id';
import { getResolvedOllamaBaseUrl } from '@/lib/ollamaUrl';
import { applyUrgencyGuard } from '@/lib/urgencyGuard';
import type { ModelId, Mood, Urgency } from '@/types/model';
import { chooseModel, type RoutingDecision } from '../modelRouter';
import type {
  InterpretationInput,
  InterpretationResult,
  InterpreterAdapter,
} from '../interpretationService';

const REQUEST_TIMEOUT_MS = 30_000;

export class GemmaNotConnectedError extends Error {
  constructor(ollamaBase: string, detail?: string) {
    super(
      `Gemma is not reachable at ${ollamaBase}. ` +
        `Set the Ollama URL in Settings → Models (HTTPS + CORS when the app is on the web). ` +
        `${detail ?? ''}`.trim(),
    );
    this.name = 'GemmaNotConnectedError';
  }
}

const MODEL_STORAGE_KEYS = {
  E2B: 'relay.model.fast',
  E4B: 'relay.model.finetuned',
  '27B': 'relay.model.quality',
} as const;

const MODEL_DEFAULTS: Record<ModelId, string> = {
  E2B: 'gemma4:e2b',
  E4B: 'gemma4:e4b',
  '27B': 'gemma4:27b',
};

function getModelName(tier: ModelId): string {
  if (typeof window === 'undefined') return MODEL_DEFAULTS[tier];
  try {
    return (
      window.localStorage.getItem(MODEL_STORAGE_KEYS[tier]) ??
      MODEL_DEFAULTS[tier]
    );
  } catch {
    return MODEL_DEFAULTS[tier];
  }
}

interface StoredProfile {
  displayName?: string;
  fullName?: string;
  pronouns?: string;
  condition?: string;
  conditionDetail?: string;
  personalPhrases?: unknown;
  voiceSamples?: unknown;
}

interface StoredVoiceSample {
  prompt?: string;
  transcript?: string;
}

const CONDITION_LABELS: Record<string, string> = {
  als: 'ALS / motor neurone disease',
  aphasia: 'aphasia (post-stroke word finding)',
  dysarthria: 'dysarthria',
  parkinson: "Parkinson's disease",
  other: 'custom (see detail)',
};

function loadStoredProfile(): StoredProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('relay.settings');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { profile?: StoredProfile };
    return parsed.profile ?? null;
  } catch {
    return null;
  }
}

function buildProfileBlock(): string {
  const profile = loadStoredProfile();
  if (!profile) return '';

  const lines: string[] = [];
  const displayName = (profile.displayName ?? '').toString().trim();
  const pronouns = (profile.pronouns ?? '').toString().trim();
  const condition = (profile.condition ?? '').toString().trim();
  const conditionDetail = (profile.conditionDetail ?? '').toString().trim();
  const phrases = Array.isArray(profile.personalPhrases)
    ? (profile.personalPhrases.filter(
        (p) => typeof p === 'string' && p.trim().length > 0,
      ) as string[])
    : [];
  const samples = Array.isArray(profile.voiceSamples)
    ? (profile.voiceSamples as StoredVoiceSample[]).filter(
        (s) =>
          typeof s?.prompt === 'string' &&
          typeof s?.transcript === 'string' &&
          s.transcript.trim().length > 0,
      )
    : [];

  if (displayName) {
    lines.push(
      `- Name: ${displayName}${pronouns ? ` (pronouns ${pronouns})` : ''}`,
    );
  }
  if (condition) {
    const label = CONDITION_LABELS[condition] ?? condition;
    lines.push(
      `- Known condition: ${label}${conditionDetail ? ` — "${conditionDetail}"` : ''}`,
    );
  }
  if (phrases.length > 0) {
    lines.push(`- Personal shortcuts: ${phrases.map((p) => `"${p}"`).join(', ')}`);
  }

  let block = '';
  if (lines.length > 0) {
    block += `\nPatient profile:\n${lines.join('\n')}`;
  }

  if (samples.length > 0) {
    const rendered = samples
      .slice(0, 6)
      .map(
        (s) =>
          `- "${(s.prompt ?? '').toString().trim()}" → heard as: "${(s.transcript ?? '').toString().trim()}"`,
      )
      .join('\n');
    block += `\nVoice calibration examples (how this patient tends to say common phrases):\n${rendered}`;
  }

  return block;
}

function buildPrompt(input: InterpretationInput): string {
  const visionLine = input.imageDataUrl
    ? '\nA camera frame is included with this request. The patient may be pointing at an object, showing their environment, or indicating something visual. Use this context to better understand their intent.'
    : '';

  const symbolLine =
    input.sourceType === 'symbols' && input.symbols?.length
      ? `\nThe patient tapped these symbols: ${input.symbols.join(', ')}`
      : '';

  const inputLine = input.transcript
    ? `Patient said (may be fragmented or unclear): "${input.transcript}"`
    : 'Patient communicated via symbols only — no spoken input.';

  const profileBlock = buildProfileBlock();

  return `You are Relay, a speech accessibility assistant for people with ALS, stroke aphasia, dysarthria, or Parkinson's disease.

Patient context:
- Language: ${input.language ?? 'en-US'}
- Input modality: ${input.sourceType}${visionLine}${symbolLine}${profileBlock}

${inputLine}

Common speech patterns to understand:
- Dropped syllables: "wan" = "want", "coff" = "coffee", "wah" = "water"
- Missing words (aphasia): "need help" = "I need help please"
- Slurred consonants (dysarthria): "I wah shum wawa" = "I want some water"
- Single words as full requests: "cold" = "I am feeling cold"
- Polish examples: "zimno" = "I am cold", "woda" = "water please"
- Arabic examples: "ماء" = "I need water", "ألم" = "I am in pain"

Reconstruct the most likely full intended sentence. Be warm and natural, not robotic.

Respond ONLY with valid JSON, no markdown, no explanation:
{
  "primaryText": "the most likely full intended sentence in the patient's language",
  "alternates": ["second interpretation", "third interpretation"],
  "confidence": 0.87,
  "urgency": "LOW",
  "mood": "calm",
  "detectedLanguage": "en-US",
  "translation": "English translation only if input was non-English — omit this field otherwise"
}

urgency rules:
- HIGH: pain, breathing difficulty, distress, emergency ("help", "can't breathe", "pain")
- NORMAL: bathroom, medication, assistance needed
- LOW: food, water, temperature, entertainment, social

mood rules:
- in-pain: mentions pain, discomfort, suffering
- distressed: urgent requests, fear, anxiety
- frustrated: repeated attempts, confusion signals
- calm: routine requests, social phrases`;
}

interface GemmaRawResponse {
  primaryText?: string;
  alternates?: unknown[];
  confidence?: number;
  urgency?: string;
  mood?: string;
  detectedLanguage?: string;
  translation?: string;
}

const VALID_URGENCY: ReadonlySet<string> = new Set([
  'LOW',
  'NORMAL',
  'HIGH',
]);
const VALID_MOOD: ReadonlySet<string> = new Set([
  'calm',
  'distressed',
  'frustrated',
  'in-pain',
]);

interface ParsedFields {
  primaryText: string;
  alternates: string[];
  confidence: number;
  urgency: Urgency;
  mood: Mood;
  detectedLanguage: string;
  translation?: string;
}

function parseGemmaResponse(
  raw: string,
  input: InterpretationInput,
): ParsedFields {
  let parsed: GemmaRawResponse;
  try {
    const clean = raw
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    parsed = JSON.parse(clean) as GemmaRawResponse;
  } catch {
    return {
      primaryText: raw.slice(0, 200) || 'Message received.',
      alternates: [],
      confidence: 0.5,
      urgency: 'NORMAL',
      mood: 'calm',
      detectedLanguage: input.language ?? 'en-US',
    };
  }

  const urgency: Urgency = VALID_URGENCY.has(String(parsed.urgency))
    ? (parsed.urgency as Urgency)
    : 'NORMAL';
  const mood: Mood = VALID_MOOD.has(String(parsed.mood))
    ? (parsed.mood as Mood)
    : 'calm';

  return {
    primaryText:
      typeof parsed.primaryText === 'string' && parsed.primaryText.length > 0
        ? parsed.primaryText
        : 'Message received.',
    alternates: Array.isArray(parsed.alternates)
      ? (parsed.alternates.filter((a) => typeof a === 'string') as string[]).slice(
          0,
          2,
        )
      : [],
    confidence:
      typeof parsed.confidence === 'number'
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.75,
    urgency,
    mood,
    detectedLanguage:
      typeof parsed.detectedLanguage === 'string'
        ? parsed.detectedLanguage
        : (input.language ?? 'en-US'),
    translation:
      typeof parsed.translation === 'string' ? parsed.translation : undefined,
  };
}

/**
 * Forgiving extractor for a JSON string field that is still streaming in.
 * Given a partial JSON buffer such as `{"primaryText":"I want co` it returns
 * `I want co`. Handles escaped quotes conservatively.
 */
function extractPartialString(
  buffer: string,
  fieldName: string,
): string | undefined {
  const key = `"${fieldName}"`;
  const keyIdx = buffer.indexOf(key);
  if (keyIdx === -1) return undefined;

  const afterKey = buffer.slice(keyIdx + key.length);
  const colonIdx = afterKey.indexOf(':');
  if (colonIdx === -1) return undefined;

  const afterColon = afterKey.slice(colonIdx + 1);
  const quoteIdx = afterColon.indexOf('"');
  if (quoteIdx === -1) return undefined;

  const valueStart = afterColon.slice(quoteIdx + 1);
  let out = '';
  let i = 0;
  while (i < valueStart.length) {
    const ch = valueStart[i];
    if (ch === '\\' && i + 1 < valueStart.length) {
      const next = valueStart[i + 1];
      if (next === 'n') out += '\n';
      else if (next === 't') out += '\t';
      else if (next === 'r') out += '\r';
      else if (next !== undefined) out += next;
      i += 2;
      continue;
    }
    if (ch === '"') {
      return out;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function stripDataUrlPrefix(dataUrl: string): string | undefined {
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) return undefined;
  const base64 = dataUrl.slice(commaIdx + 1);
  return base64.length > 0 ? base64 : undefined;
}

interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream: boolean;
  format: 'json';
  options: { temperature: number; num_predict: number };
  images?: string[];
}

async function callOllamaStreaming(
  ollamaBase: string,
  modelName: string,
  prompt: string,
  onChunk: ((partialPrimaryText: string) => void) | undefined,
  imageDataUrl: string | undefined,
): Promise<string> {
  const body: OllamaGenerateRequest = {
    model: modelName,
    prompt,
    stream: true,
    format: 'json',
    options: { temperature: 0.3, num_predict: 400 },
  };

  if (imageDataUrl) {
    const base64 = stripDataUrlPrefix(imageDataUrl);
    if (base64) body.images = [base64];
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${ollamaBase}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify(body),
    });
  } catch (err) {
    clearTimeout(timeoutId);
    throw new GemmaNotConnectedError(
      ollamaBase,
      err instanceof Error ? err.message : undefined,
    );
  }

  if (!res.ok || !res.body) {
    clearTimeout(timeoutId);
    throw new GemmaNotConnectedError(ollamaBase, `HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  let pending = '';
  let lastPushed = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      pending += decoder.decode(value, { stream: true });
      let newlineIdx = pending.indexOf('\n');
      while (newlineIdx !== -1) {
        const line = pending.slice(0, newlineIdx).trim();
        pending = pending.slice(newlineIdx + 1);
        if (line) {
          try {
            const parsed = JSON.parse(line) as {
              response?: string;
              done?: boolean;
            };
            if (typeof parsed.response === 'string') {
              full += parsed.response;
              if (onChunk) {
                const partial = extractPartialString(full, 'primaryText');
                if (partial !== undefined && partial !== lastPushed) {
                  lastPushed = partial;
                  onChunk(partial);
                }
              }
            }
          } catch {
            // Partial / non-JSON line; skip silently.
          }
        }
        newlineIdx = pending.indexOf('\n');
      }
    }
  } catch (err) {
    throw new GemmaNotConnectedError(
      ollamaBase,
      err instanceof Error ? err.message : undefined,
    );
  } finally {
    clearTimeout(timeoutId);
  }

  return full;
}

function buildInferenceRequest(input: InterpretationInput) {
  const inputType: 'symbols' | 'vision+speech' | 'text' | 'speech' =
    input.sourceType === 'symbols'
      ? 'symbols'
      : input.imageDataUrl
        ? 'vision+speech'
        : input.sourceType === 'text'
          ? 'text'
          : 'speech';

  return {
    inputType,
    transcript: input.transcript,
    symbols: input.symbols,
    visionOn: Boolean(input.imageDataUrl),
    urgencyHint: input.urgencyHint,
    language: input.language,
  };
}

async function interpret(
  input: InterpretationInput,
): Promise<InterpretationResult> {
  const ollamaBase = getResolvedOllamaBaseUrl();
  const req = buildInferenceRequest(input);
  const decision: RoutingDecision = chooseModel(req);
  const modelName = getModelName(decision.model);
  const prompt = buildPrompt(input);
  const t0 = Date.now();

  const rawResponse = await callOllamaStreaming(
    ollamaBase,
    modelName,
    prompt,
    input.onStreamChunk,
    input.imageDataUrl,
  );
  const latencyMs = Date.now() - t0;

  const parsed = parseGemmaResponse(rawResponse, input);
  const guardedUrgency = applyUrgencyGuard(parsed.urgency, input.transcript);

  return {
    id: uid('interp'),
    ts: Date.now(),
    primaryText: parsed.primaryText,
    alternates: parsed.alternates,
    confidence: parsed.confidence,
    urgency: guardedUrgency,
    mood: parsed.mood,
    detectedLanguage: parsed.detectedLanguage,
    translation: parsed.translation,
    sourceModel: decision.model,
    sourceType: input.sourceType,
    routingReason: decision.reason,
    latencyMs,
    visionUsed: Boolean(input.imageDataUrl),
    sourceFragment:
      input.transcript?.slice(0, 60) ?? input.symbols?.join(', '),
  };
}

export const GemmaInterpreterAdapter: InterpreterAdapter = {
  id: 'gemma',
  interpret,
};
