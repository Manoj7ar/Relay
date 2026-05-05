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
 * `GemmaNotConnectedError` with a structured `surface` for the UI
 * (`state.lastError`: title, hint, optional technical).
 *
 * See docs/GEMMA_AND_INTEGRATIONS.md for the deployment checklist.
 */

import { resolveBilingualHero } from '@/lib/bilingualHero';
import {
  inferSpeakerFromDetectedLanguage,
  inferSpeakerFromTranscript,
} from '@/lib/transcriptSpeakerHint';
import { uid } from '@/lib/id';
import { getOllamaModelTagForTier } from '@/lib/ollamaModelConfig';
import { getResolvedOllamaBaseUrl } from '@/lib/ollamaUrl';
import { incrementConfirmation, listEntries } from '@/lib/patientDictionary';
import { applyUrgencyGuard } from '@/lib/urgencyGuard';
import type { DictionaryEntry, SignalModality } from '@/types/dictionary';
import type { Mood, Urgency } from '@/types/model';
import { chooseModel, type RoutingDecision } from '../modelRouter';
import type {
  InterpretationInput,
  InterpretationResult,
  InterpreterAdapter,
} from '../interpretationService';
import type { SessionInterpretationError } from '@/types/interpretationError';

const REQUEST_TIMEOUT_MS = 30_000;
const DICTIONARY_CONTEXT_LIMIT = 30;

function buildOllamaErrorSurface(
  endpoint: string,
  detail?: string,
): SessionInterpretationError {
  const d = detail?.trim() ?? '';
  const technical =
    d && (d.length > 60 || d.startsWith('HTTP')) ? d.slice(0, 320) : undefined;
  if (/abort|timeout|timed out|network|failed to fetch|load failed|ECONNREFUSED/i.test(d)) {
    return {
      code: 'ollama_unreachable',
      title: "Can't reach Ollama",
      hint: 'Check the URL in Settings → Models and that this browser can reach that host (LAN or CORS).',
      technical,
    };
  }
  if (/HTTP\s+[45]\d\d/i.test(d)) {
    return {
      code: 'ollama_unreachable',
      title: 'Ollama returned an error',
      hint: 'Confirm the model is pulled and the server is running.',
      technical,
    };
  }
  return {
    code: 'ollama_unreachable',
    title: "Can't reach Ollama",
    hint: 'Open Settings → Models & connectivity and verify the server address.',
    technical: technical ?? (endpoint ? `Endpoint: ${endpoint}` : undefined),
  };
}

export class GemmaNotConnectedError extends Error {
  readonly surface: SessionInterpretationError;

  constructor(endpoint: string, detail?: string) {
    const surface = buildOllamaErrorSurface(endpoint, detail);
    super(surface.title);
    this.name = 'GemmaNotConnectedError';
    this.surface = surface;
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

function inferSignalModality(input: InterpretationInput): SignalModality {
  const channels = [
    input.transcript ? 'transcript' : null,
    input.imageDataUrl ? 'image' : null,
    input.audioDataUrl ? 'audio' : null,
    input.symbolIds?.length || input.symbols?.length ? 'symbols' : null,
    input.gestureHints?.length ? 'gestures' : null,
  ].filter(Boolean);

  if (channels.length > 1) return 'compound';
  if (input.symbolIds?.length || input.symbols?.length) return 'symbol';
  if (input.imageDataUrl || input.gestureHints?.length) return 'gesture';

  const transcript = input.transcript?.trim() ?? '';
  const wordCount = transcript.split(/\s+/).filter(Boolean).length;
  return wordCount > 0 && (wordCount <= 2 || transcript.length <= 14)
    ? 'partial_word'
    : 'vocalization';
}

function compactDictionaryEntries(entries: DictionaryEntry[]) {
  return entries.map((entry) => ({
    id: entry.id,
    modality: entry.modality,
    rawTranscript: entry.rawTranscript,
    hasImage: Boolean(entry.imageDataUrl),
    symbolIds: entry.symbolIds,
    meaning: entry.meaning,
    contextTags: entry.contextTags,
    confirmations: entry.confirmations,
    lastSeenAt: entry.lastSeenAt,
  }));
}

export async function loadRelevantDictionaryEntries(
  input: InterpretationInput,
): Promise<DictionaryEntry[]> {
  if (input.recentEntries) {
    return input.recentEntries.slice(0, DICTIONARY_CONTEXT_LIMIT);
  }

  const modality = inferSignalModality(input);
  const primary = await listEntries({
    modality,
    limit: DICTIONARY_CONTEXT_LIMIT,
    recent: true,
  });

  if (primary.length >= DICTIONARY_CONTEXT_LIMIT || modality !== 'compound') {
    return primary;
  }

  const fallback = await listEntries({
    limit: DICTIONARY_CONTEXT_LIMIT,
    recent: true,
  });
  const merged = new Map<string, DictionaryEntry>();
  [...primary, ...fallback].forEach((entry) => merged.set(entry.id, entry));
  return [...merged.values()].slice(0, DICTIONARY_CONTEXT_LIMIT);
}

function buildPatientSignalBlock(entries: DictionaryEntry[]): string {
  if (!entries.length) return '';
  return `\nPatient's known signals (compact JSON; only use ids that truly influenced the answer):\n${JSON.stringify(compactDictionaryEntries(entries))}`;
}

function normalizeInferredSpeaker(
  value: unknown,
): 'patient' | 'caregiver' | undefined {
  if (typeof value !== 'string') return undefined;
  const s = value.trim().toLowerCase();
  if (s === 'caregiver') return 'caregiver';
  if (s === 'patient') return 'patient';
  return undefined;
}

export function buildChannelSummary(input: InterpretationInput): string[] {
  const channels: string[] = [];
  if (input.transcript) channels.push(`speech transcript: "${input.transcript}"`);
  if (input.audioDataUrl && !input.transcript?.trim()) {
    channels.push('speech audio: included with this request');
  }
  if (input.symbols?.length || input.symbolIds?.length) {
    channels.push(
      `symbols: ${JSON.stringify({
        labels: input.symbols ?? [],
        ids: input.symbolIds ?? [],
      })}`,
    );
  }
  if (input.imageDataUrl) {
    channels.push('camera frame: included with this request');
  }
  if (input.gestureHints?.length) {
    channels.push(`gesture hints: ${input.gestureHints.join(', ')}`);
  }
  if (input.timeOfDay) channels.push(`time of day: ${input.timeOfDay}`);
  return channels;
}

export function getContributingChannels(input: InterpretationInput): string[] {
  const channels: string[] = [];
  if (input.transcript || input.audioDataUrl) channels.push('speech');
  if (input.symbols?.length || input.symbolIds?.length) channels.push('symbols');
  if (input.imageDataUrl) channels.push('camera');
  if (input.gestureHints?.length) channels.push('gesture');
  if (input.timeOfDay) channels.push('time');
  return channels;
}

export function buildPrompt(
  input: InterpretationInput,
  dictionaryEntries: DictionaryEntry[],
): string {
  const channels = buildChannelSummary(input);
  const symbolOnly = input.sourceType === 'symbols';
  const photoOnly =
    Boolean(input.imageDataUrl) &&
    !input.transcript &&
    !input.symbols?.length &&
    !input.symbolIds?.length &&
    !input.gestureHints?.length;

  const micHint =
    input.speakerRole === 'caregiver'
      ? '\n- HINT: The mic is usually used by the CAREGIVER on this device; when unsure, lean inferredSpeaker toward "caregiver".'
      : '\n- HINT: The mic is usually used by the PATIENT on this device; when unsure, lean inferredSpeaker toward "patient".';

  const speakerBlock = symbolOnly
    ? '\nINPUT IS SYMBOL BOARD ONLY: the speaker is always the PATIENT. Set inferredSpeaker to "patient".'
    : photoOnly
      ? '\nINPUT IS PHOTO ONLY: the suggested phrase is for the PATIENT. Set inferredSpeaker to "patient".'
      : `\n${input.conversationTail?.trim() ? `${input.conversationTail.trim()}\n` : ''}Speaker inference:
- Decide whether the current spoken or typed input is from the PATIENT (AAC user) or the CAREGIVER/companion, using transcript language, who is being addressed, clinical vs everyday phrasing, and continuity with recent exchanges.${micHint}
- You MUST output inferredSpeaker as exactly "patient" or "caregiver".
- detectedLanguage MUST be the BCP-47 tag of the LANGUAGE THE SOURCE SPEAKER actually used (not the translation), e.g. ar, ar-EG, en-US — this drives automatic language pairing in the app.`;

  const symbolLine =
    (input.sourceType === 'symbols' || input.symbols?.length) && input.symbols?.length
      ? `\nThe patient tapped these symbols: ${input.symbols.join(', ')}`
      : '';

  const inputLine = input.transcript
    ? `Current transcript (may be fragmented; speaker may be patient OR caregiver): "${input.transcript}"`
    : input.audioDataUrl
      ? 'Current speech audio clip is attached; transcribe it and infer the patient intent.'
    : photoOnly
      ? 'Patient provided a camera frame only — no spoken, typed, or symbol input.'
      : 'Patient communicated via symbols only — no spoken input.';

  const profileBlock = buildProfileBlock();
  const patientSignalBlock = buildPatientSignalBlock(dictionaryEntries);

  return `You are Relay, a speech accessibility assistant for people with ALS, stroke aphasia, dysarthria, or Parkinson's disease.

Patient context:
- Patient language (BCP-47): ${input.patientLanguage}
- Caregiver language (BCP-47): ${input.caregiverLanguage}
- Legacy locale hint: ${input.language ?? input.patientLanguage}
- Input modality: ${input.sourceType}${symbolLine}${profileBlock}${patientSignalBlock}${speakerBlock}

Concurrent signal channels captured at ${new Date().toISOString()}:
${channels.length > 0 ? channels.map((channel) => `- ${channel}`).join('\n') : `- ${inputLine}`}

If speech audio is attached, first transcribe it internally, then use the transcription with the same rules below.

Common speech patterns to understand:
- Dropped syllables: "wan" = "want", "coff" = "coffee", "wah" = "water"
- Missing words (aphasia): "need help" = "I need help please"
- Slurred consonants (dysarthria): "I wah shum wawa" = "I want some water"
- Single words as full requests: "cold" = "I am feeling cold"
- Polish examples: "zimno" = "I am cold", "woda" = "water please"
- Arabic examples: "ماء" = "I need water", "ألم" = "I am in pain"

Given these concurrent signals and this patient's known local dictionary, infer the most likely single intent. Prefer patient-specific dictionary meanings over generic AAC assumptions when the current input is similar. Be warm and natural, not robotic.
${photoOnly ? '\nPHOTO-ONLY TASK: infer a concise phrase the patient may want to say from the image context. If uncertain, make the primaryText a gentle suggestion such as "I might need help with this."' : ''}

You MUST output the clarified intent in BOTH configured languages:
- patientLanguageText: full sentence in patient language (${input.patientLanguage})
- caregiverLanguageText: same meaning in caregiver language (${input.caregiverLanguage})
- primaryText: MUST be an exact duplicate of patientLanguageText (used for streaming previews)
- detectedLanguage: BCP-47 code for the SOURCE speaker's language (not the translation) — must align with the words in the transcript
- inferredSpeaker: "patient" or "caregiver" — who produced the current input (see speaker rules above)

Respond ONLY with valid JSON, no markdown, no explanation:
{
  "primaryText": "duplicate of patientLanguageText",
  "patientLanguageText": "full clarified sentence in patient language",
  "caregiverLanguageText": "same clarified sentence in caregiver language",
  "inferredSpeaker": "patient",
  "alternates": ["second interpretation", "third interpretation"],
  "confidence": 0.87,
  "urgency": "LOW",
  "mood": "calm",
  "detectedLanguage": "en-US",
  "dictionaryMatchIds": ["dict_id_used_if_any"]
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
  patientLanguageText?: string;
  caregiverLanguageText?: string;
  inferredSpeaker?: string;
  alternates?: unknown[];
  confidence?: number;
  urgency?: string;
  mood?: string;
  detectedLanguage?: string;
  translation?: string;
  dictionaryMatchIds?: unknown[];
  environmentSummary?: string;
  environmentSuggestedPhrases?: unknown[];
  environmentScheduleHints?: unknown[];
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

export interface ParsedFields {
  patientLanguageText: string;
  caregiverLanguageText: string;
  inferredSpeakerModel?: 'patient' | 'caregiver';
  alternates: string[];
  confidence: number;
  urgency: Urgency;
  mood: Mood;
  detectedLanguage: string;
  dictionaryMatchIds: string[];
  environmentSummary: string;
  environmentSuggestedPhrases: string[];
  environmentScheduleHints: string[];
}

function parseStringArrayField(value: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const x of value) {
    if (typeof x !== 'string') continue;
    const t = x.trim();
    if (!t) continue;
    out.push(t.length > maxLen ? `${t.slice(0, maxLen - 1)}…` : t);
    if (out.length >= maxItems) break;
  }
  return out;
}

export function parseGemmaResponse(
  raw: string,
  input: InterpretationInput,
  allowedDictionaryIds: ReadonlySet<string>,
): ParsedFields {
  let parsed: GemmaRawResponse;
  try {
    const clean = raw
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    parsed = JSON.parse(clean) as GemmaRawResponse;
  } catch {
    const fallback = userFacingFallbackFromUnparsedInterpretationJson(raw);
    return {
      patientLanguageText: fallback,
      caregiverLanguageText: fallback,
      inferredSpeakerModel: undefined,
      alternates: [],
      confidence: 0.5,
      urgency: 'NORMAL',
      mood: 'calm',
      detectedLanguage: input.language ?? 'en-US',
      dictionaryMatchIds: [],
      environmentSummary: '',
      environmentSuggestedPhrases: [],
      environmentScheduleHints: [],
    };
  }

  const urgency: Urgency = VALID_URGENCY.has(String(parsed.urgency))
    ? (parsed.urgency as Urgency)
    : 'NORMAL';
  const mood: Mood = VALID_MOOD.has(String(parsed.mood))
    ? (parsed.mood as Mood)
    : 'calm';

  const patientRaw =
    typeof parsed.patientLanguageText === 'string' &&
    parsed.patientLanguageText.length > 0
      ? parsed.patientLanguageText
      : typeof parsed.primaryText === 'string' && parsed.primaryText.length > 0
        ? parsed.primaryText
        : 'Message received.';
  const caregiverRaw =
    typeof parsed.caregiverLanguageText === 'string' &&
    parsed.caregiverLanguageText.length > 0
      ? parsed.caregiverLanguageText
      : typeof parsed.translation === 'string' && parsed.translation.length > 0
        ? parsed.translation
        : patientRaw;

  return {
    patientLanguageText: patientRaw,
    caregiverLanguageText: caregiverRaw,
    inferredSpeakerModel: normalizeInferredSpeaker(parsed.inferredSpeaker),
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
    dictionaryMatchIds: Array.isArray(parsed.dictionaryMatchIds)
      ? parsed.dictionaryMatchIds
          .filter(
            (id): id is string =>
              typeof id === 'string' && allowedDictionaryIds.has(id),
          )
          .slice(0, 5)
      : [],
    environmentSummary:
      typeof parsed.environmentSummary === 'string'
        ? parsed.environmentSummary.trim().slice(0, 600)
        : '',
    environmentSuggestedPhrases: parseStringArrayField(
      parsed.environmentSuggestedPhrases,
      6,
      120,
    ),
    environmentScheduleHints: parseStringArrayField(
      parsed.environmentScheduleHints,
      8,
      100,
    ),
  };
}

/**
 * Forgiving extractor for a JSON string field that is still streaming in.
 * Given a partial JSON buffer such as `{"primaryText":"I want co` it returns
 * `I want co`. Handles escaped quotes conservatively.
 */
export function extractPartialString(
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

/** When full JSON.parse fails, never surface raw JSON; try the same progressive extractors as streaming. */
function userFacingFallbackFromUnparsedInterpretationJson(raw: string): string {
  const cleaned = raw
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  for (const field of [
    'patientLanguageText',
    'primaryText',
    'caregiverLanguageText',
  ] as const) {
    const extracted = extractPartialString(cleaned, field);
    if (extracted !== undefined && extracted.trim().length > 0) {
      return extracted.trim();
    }
  }
  return 'Message received.';
}

export function stripDataUrlPrefix(dataUrl: string): string | undefined {
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

export function buildInferenceRequest(input: InterpretationInput) {
  const channelCount = getContributingChannels(input).filter(
    (channel) => channel !== 'time',
  ).length;
  const inputType: 'symbols' | 'vision+speech' | 'text' | 'speech' | 'compound' =
    channelCount > 1
      ? 'compound'
      : input.sourceType === 'symbols'
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
    symbolIds: input.symbolIds,
    audioDataUrl: input.audioDataUrl,
    gestureHints: input.gestureHints,
    timeOfDay: input.timeOfDay,
    visionOn: Boolean(input.imageDataUrl),
    urgencyHint: input.urgencyHint,
    language: input.language ?? input.patientLanguage,
  };
}

async function interpret(
  input: InterpretationInput,
): Promise<InterpretationResult> {
  const ollamaBase = getResolvedOllamaBaseUrl();
  const req = buildInferenceRequest(input);
  const decision: RoutingDecision = chooseModel(req);
  const modelName = getOllamaModelTagForTier(decision.model);
  const dictionaryEntries = await loadRelevantDictionaryEntries(input);
  const allowedDictionaryIds = new Set(dictionaryEntries.map((entry) => entry.id));
  const prompt = buildPrompt(input, dictionaryEntries);
  const t0 = Date.now();

  const rawResponse = await callOllamaStreaming(
    ollamaBase,
    modelName,
    prompt,
    input.onStreamChunk,
    input.imageDataUrl,
  );
  const latencyMs = Date.now() - t0;

  const parsed = parseGemmaResponse(rawResponse, input, allowedDictionaryIds);
  const guardedUrgency = applyUrgencyGuard(parsed.urgency, input.transcript);
  await Promise.all(parsed.dictionaryMatchIds.map((id) => incrementConfirmation(id)));

  const symbolOnly = input.sourceType === 'symbols';

  const fromModel = symbolOnly ? undefined : parsed.inferredSpeakerModel;
  const transcriptHint = symbolOnly
    ? undefined
    : inferSpeakerFromTranscript(
        input.transcript ?? '',
        input.patientLanguage,
        input.caregiverLanguage,
      );
  const fromDetection = symbolOnly
    ? undefined
    : inferSpeakerFromDetectedLanguage(
        parsed.detectedLanguage,
        input.patientLanguage,
        input.caregiverLanguage,
      );

  const tieBreakSpeaker: 'patient' | 'caregiver' = symbolOnly
    ? 'patient'
    : (fromModel ??
      transcriptHint ??
      fromDetection ??
      input.speakerRole ??
      input.sessionLastInferredSpeaker ??
      'patient');

  const inferredSpeaker: 'patient' | 'caregiver' = symbolOnly
    ? 'patient'
    : (fromModel ??
      transcriptHint ??
      fromDetection ??
      input.speakerRole ??
      input.sessionLastInferredSpeaker ??
      'patient');

  const bilingual = resolveBilingualHero({
    patientLanguageText: parsed.patientLanguageText,
    caregiverLanguageText: parsed.caregiverLanguageText,
    patientLang: input.patientLanguage,
    caregiverLang: input.caregiverLanguage,
    detectedLanguage: parsed.detectedLanguage,
    speakerRole: tieBreakSpeaker,
  });

  const envMode =
    Boolean(input.environmentHelper) &&
    Boolean(input.imageDataUrl?.trim()) &&
    !input.transcript?.trim() &&
    !input.symbols?.length &&
    !input.symbolIds?.length;

  return {
    id: uid('interp'),
    ts: Date.now(),
    primaryText: bilingual.primaryText,
    patientLanguageText: bilingual.patientLanguageText,
    caregiverLanguageText: bilingual.caregiverLanguageText,
    alternates: parsed.alternates,
    confidence: parsed.confidence,
    urgency: guardedUrgency,
    mood: parsed.mood,
    detectedLanguage: parsed.detectedLanguage,
    translation: bilingual.translation,
    ttsLang: bilingual.ttsLang,
    bilingualAmbiguous: bilingual.ambiguous,
    inferredSpeaker,
    sourceModel: decision.model,
    sourceType: input.sourceType,
    routingReason: decision.reason,
    latencyMs,
    visionUsed: Boolean(input.imageDataUrl),
    dictionaryMatchIds: parsed.dictionaryMatchIds,
    contributingChannels: getContributingChannels(input),
    sourceFragment:
      input.transcript?.slice(0, 60) ??
      input.symbols?.join(', ') ??
      (input.imageDataUrl ? 'Photo only' : undefined),
    ...(envMode
      ? {
          environmentScan: true,
          environmentSummary: parsed.environmentSummary,
          environmentSuggestedPhrases: parsed.environmentSuggestedPhrases,
          environmentScheduleHints: parsed.environmentScheduleHints,
        }
      : {}),
  };
}

export const GemmaInterpreterAdapter: InterpreterAdapter = {
  id: 'gemma',
  interpret,
};
