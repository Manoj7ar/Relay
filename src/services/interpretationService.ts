/**
 * Single "raw input -> interpreted phrase" entry point.
 *
 * All UI + contexts call `interpret(input, opts)`; the adapter is selected
 * by `mode` (browser fallback, mock/demo that wraps the local routing
 * policy, or Gemma once wired). The returned shape matches the future
 * Gemma output schema so UI never changes when swapping adapters.
 *
 * See docs/GEMMA_AND_INTEGRATIONS.md.
 */

import type { Mood, Urgency } from '@/types/model';
import { BrowserPassthroughAdapter } from './interpretation/BrowserPassthroughAdapter';
import { MockRouterAdapter } from './interpretation/MockRouterAdapter';
import { GemmaInterpreterAdapter } from './interpretation/GemmaInterpreterAdapter';

export type InterpretationSourceType = 'speech' | 'text' | 'symbols' | 'demo';
export type InterpreterMode = 'browser' | 'mock' | 'gemma';

export interface InterpretationInput {
  sourceType: InterpretationSourceType;
  transcript?: string;
  symbols?: string[];
  imageDataUrl?: string;
  language?: string;
  urgencyHint?: Urgency;
  /** Optional scenario id when `sourceType === 'demo'`. */
  scenarioId?: string;
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
  readonly id: InterpreterMode;
  interpret(input: InterpretationInput): Promise<InterpretationResult>;
}

const adapters: Record<InterpreterMode, InterpreterAdapter> = {
  browser: BrowserPassthroughAdapter,
  mock: MockRouterAdapter,
  gemma: GemmaInterpreterAdapter,
};

export interface InterpretOptions {
  mode: InterpreterMode;
}

export async function interpret(
  input: InterpretationInput,
  opts: InterpretOptions,
): Promise<InterpretationResult> {
  const adapter = adapters[opts.mode];
  if (!adapter) {
    throw new Error(`Unknown interpreter mode: ${opts.mode}`);
  }
  return adapter.interpret(input);
}

export function getAdapter(mode: InterpreterMode): InterpreterAdapter {
  return adapters[mode];
}
