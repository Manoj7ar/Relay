/**
 * Minimal browser-side interpretation: no AI, just normalize the incoming
 * transcript or symbol expansion so the loop (mic -> STT -> confirm ->
 * TTS -> log) works end-to-end before Gemma is wired.
 *
 * This is explicitly "fallback / dev infrastructure". Any heuristics live
 * here, isolated from React components. A tiny optional fragment map is
 * kept behind the `RELAY_PASSTHROUGH_NORMALIZE` flag so the passthrough
 * default is truly literal.
 */

import { uid } from '@/lib/id';
import type { Urgency } from '@/types/model';
import type {
  InterpretationInput,
  InterpretationResult,
  InterpreterAdapter,
} from '../interpretationService';

const FRAGMENT_MAP: Array<{ match: RegExp; out: string; urgency?: Urgency }> = [
  { match: /\bpain\b|\bhurt/i, out: 'I am in pain and need help.', urgency: 'HIGH' },
  { match: /\bwater\b|\bdrink\b/i, out: 'I would like some water, please.' },
  {
    match: /\bbreakfast\b|\bhungry\b|\bfood\b/i,
    out: 'I am ready for a meal.',
  },
  {
    match: /\bbathroom\b|\btoilet\b/i,
    out: 'I need to use the bathroom.',
  },
  { match: /\bcold\b|\bchill/i, out: 'I feel cold.' },
  {
    match: /\bhelp\b|\bemergency\b|\b911\b/i,
    out: 'I need urgent help, please.',
    urgency: 'HIGH',
  },
];

function capitalize(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function ensureSentencePunctuation(text: string): string {
  if (!text) return text;
  const last = text.trim().slice(-1);
  if (['.', '?', '!'].includes(last)) return text.trim();
  return text.trim() + '.';
}

function urgencyFromText(text: string, hint?: Urgency): Urgency {
  if (hint) return hint;
  const lower = text.toLowerCase();
  if (/(emergency|911|can'?t breathe|chest pain|bleeding)/.test(lower)) {
    return 'HIGH';
  }
  for (const row of FRAGMENT_MAP) {
    if (row.urgency === 'HIGH' && row.match.test(lower)) return 'HIGH';
  }
  return 'NORMAL';
}

function normalizeEnabled(): boolean {
  // Kept as an env-style flag so tests / dev can turn it off.
  if (typeof import.meta !== 'undefined') {
    const env = (import.meta as unknown as { env?: Record<string, string> })
      .env;
    if (env && env.VITE_RELAY_PASSTHROUGH_NORMALIZE === 'off') return false;
  }
  return true;
}

function softExpand(text: string): string {
  if (!normalizeEnabled()) return ensureSentencePunctuation(capitalize(text));
  for (const row of FRAGMENT_MAP) {
    if (row.match.test(text)) return row.out;
  }
  return ensureSentencePunctuation(capitalize(text));
}

async function interpret(
  input: InterpretationInput,
): Promise<InterpretationResult> {
  const started = performance.now();
  const fragment =
    input.transcript?.trim() ??
    input.symbols?.join(' ').trim() ??
    '';
  const primary = fragment
    ? softExpand(fragment)
    : 'I would like to say something.';
  const urgency = urgencyFromText(primary, input.urgencyHint);
  const language =
    input.language ??
    (typeof navigator !== 'undefined' ? navigator.language : 'en-US') ??
    'en-US';

  return {
    id: uid('utt'),
    ts: Date.now(),
    primaryText: primary,
    alternates: buildAlternates(primary),
    confidence: input.sourceType === 'speech' ? 0.72 : 0.88,
    urgency,
    mood: urgency === 'HIGH' ? 'distressed' : 'calm',
    detectedLanguage: language,
    sourceModel: 'browser',
    sourceType: input.sourceType,
    routingReason:
      input.sourceType === 'speech'
        ? 'Browser fallback (Web Speech API passthrough).'
        : 'Browser fallback (typed / symbol passthrough).',
    latencyMs: Math.round(performance.now() - started),
    visionUsed: Boolean(input.imageDataUrl),
    sourceFragment: fragment || undefined,
  };
}

function buildAlternates(primary: string): string[] {
  const core = primary.replace(/[.?!]+$/, '');
  return [`Please, ${core.toLowerCase()}.`, `${core} now, please.`].slice(0, 2);
}

export const BrowserPassthroughAdapter: InterpreterAdapter = {
  id: 'browser',
  interpret,
};
