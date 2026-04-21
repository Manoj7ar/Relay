/**
 * Single "raw input → interpreted phrase" entry point.
 *
 * All UI + contexts call `interpret(input)`. The implementation is whatever
 * the single adapter does — currently `GemmaInterpreterAdapter`, which
 * throws `NotImplemented` until a real Gemma 4 / Ollama endpoint is wired.
 * The returned shape is aligned to Gemma's eventual output so UI never
 * changes when the adapter body is filled in.
 *
 * See docs/GEMMA_AND_INTEGRATIONS.md.
 */

import type { Mood, Urgency } from '@/types/model';
import { GemmaInterpreterAdapter } from './interpretation/GemmaInterpreterAdapter';

export type InterpretationSourceType = 'speech' | 'text' | 'symbols';

export interface InterpretationInput {
  sourceType: InterpretationSourceType;
  transcript?: string;
  symbols?: string[];
  imageDataUrl?: string;
  language?: string;
  urgencyHint?: Urgency;
}

export interface InterpretationResult {
  id: string;
  ts: number;
  primaryText: string;
  alternates: string[];
  confidence: number;
  urgency: Urgency;
  mood: Mood;
  detectedLanguage: string;
  translation?: string;
  /** E2B / E4B / 27B — populated by the real adapter. */
  sourceModel: string;
  sourceType: InterpretationSourceType;
  /** For the routing log / ModelChip. */
  routingReason: string;
  latencyMs: number;
  visionUsed: boolean;
  /** Raw user-facing fragment (what was actually spoken / typed / symbol). */
  sourceFragment?: string;
}

export interface InterpreterAdapter {
  readonly id: string;
  interpret(input: InterpretationInput): Promise<InterpretationResult>;
}

/**
 * The one and only adapter. Replace the body of
 * `GemmaInterpreterAdapter.interpret` with a real Gemma 4 call and every
 * input source (mic → STT, typed, quick phrases, symbols, camera frame)
 * starts producing real results without any UI change.
 */
const adapter: InterpreterAdapter = GemmaInterpreterAdapter;

export async function interpret(
  input: InterpretationInput,
): Promise<InterpretationResult> {
  return adapter.interpret(input);
}
