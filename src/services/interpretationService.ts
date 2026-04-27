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
import type { DictionaryEntry } from '@/types/dictionary';
import { GemmaInterpreterAdapter } from './interpretation/GemmaInterpreterAdapter';

export type InterpretationSourceType = 'speech' | 'text' | 'symbols';

export type BilingualSpeakerRole = 'patient' | 'caregiver';

export interface InterpretationInput {
  sourceType: InterpretationSourceType;
  transcript?: string;
  symbols?: string[];
  symbolIds?: string[];
  imageDataUrl?: string;
  gestureHints?: string[];
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  recentEntries?: DictionaryEntry[];
  /** BCP-47 patient language from settings (clarified output + dictionary context). */
  patientLanguage: string;
  /** BCP-47 caregiver language from settings (parallel translation). */
  caregiverLanguage: string;
  /**
   * Explicit speaker override (e.g. symbol board). When omitted, Gemma +
   * transcript heuristics + session continuity infer the speaker.
   */
  speakerRole?: BilingualSpeakerRole;
  /** Last session inference (from prior turns). */
  sessionLastInferredSpeaker?: 'patient' | 'caregiver' | null;
  /** Pre-formatted recent lines for the model (see `formatConversationTailForPrompt`). */
  conversationTail?: string;
  /** Legacy hint: often the active STT locale; model still receives patient + caregiver codes. */
  language?: string;
  urgencyHint?: Urgency;
  /**
   * Optional callback fired as partial output streams back from the model.
   * The adapter passes the best-effort progressive `primaryText` extracted
   * from the still-incomplete JSON response. No JSON syntax is ever leaked
   * through this callback — callers can safely pipe it into UI.
   */
  onStreamChunk?: (partialPrimaryText: string) => void;
}

export interface InterpretationResult {
  id: string;
  ts: number;
  primaryText: string;
  /** Clarified intent in the patient's configured language. */
  patientLanguageText: string;
  /** Same intent in the caregiver's configured language. */
  caregiverLanguageText: string;
  alternates: string[];
  confidence: number;
  urgency: Urgency;
  mood: Mood;
  detectedLanguage: string;
  translation?: string;
  /** Language tag to use for TTS of `primaryText` (listener-facing). */
  ttsLang: string;
  /** Model could not confidently match detectedLanguage to either configured language. */
  bilingualAmbiguous: boolean;
  /** E2B / E4B / 27B — populated by the real adapter. */
  sourceModel: string;
  sourceType: InterpretationSourceType;
  /** For the routing log (tier codes E2B / E4B / 27B). */
  routingReason: string;
  latencyMs: number;
  visionUsed: boolean;
  dictionaryMatchIds: string[];
  contributingChannels: string[];
  /** Raw user-facing fragment (what was actually spoken / typed / symbol). */
  sourceFragment?: string;
  /** Resolved speaker for this turn (persistence + follow-on recognition). */
  inferredSpeaker: BilingualSpeakerRole;
}

export interface InterpreterAdapter {
  readonly id: string;
  interpret(input: InterpretationInput): Promise<InterpretationResult>;
}

/**
 * The one and only adapter. Replace the body of
 * `GemmaInterpreterAdapter.interpret` with a real Gemma 4 call and every
 * input source (mic → STT, typed, symbols, camera frame)
 * starts producing real results without any UI change.
 */
const adapter: InterpreterAdapter = GemmaInterpreterAdapter;

export async function interpret(
  input: InterpretationInput,
): Promise<InterpretationResult> {
  return adapter.interpret(input);
}
