/**
 * Single "raw input → interpreted phrase" entry point.
 *
 * All UI + contexts call `interpret(input)`. This build routes patient
 * interpretation through **Ollama** (OpenAI-compatible chat). The returned shape
 * stays aligned to Relay's JSON contract so the UI stays stable.
 */

import type { InferenceTelemetry, Mood, Urgency } from '@/types/model';
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
  audioDataUrl?: string;
  gestureHints?: string[];
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  recentEntries?: DictionaryEntry[];
  /** BCP-47 patient language from settings (clarified output + dictionary context). */
  patientLanguage: string;
  /** BCP-47 caregiver language from settings (parallel translation). */
  caregiverLanguage: string;
  /**
   * Explicit speaker override (e.g. symbol board). When omitted, the model +
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
  /**
   * Photo of board/menu/schedule: model returns structured environment fields
   * in addition to the usual bilingual phrase.
   */
  environmentHelper?: boolean;
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
  /** Hosted adapter id — `OLLAMA` for this build. */
  sourceModel: string;
  sourceType: InterpretationSourceType;
  /** For the routing log. */
  routingReason: string;
  latencyMs: number;
  visionUsed: boolean;
  dictionaryMatchIds: string[];
  contributingChannels: string[];
  /** Raw user-facing fragment (what was actually spoken / typed / symbol). */
  sourceFragment?: string;
  /** Resolved speaker for this turn (persistence + follow-on recognition). */
  inferredSpeaker: BilingualSpeakerRole;
  /** True when `environmentHelper` photo analysis ran. */
  environmentScan?: boolean;
  environmentSummary?: string;
  environmentSuggestedPhrases?: string[];
  environmentScheduleHints?: string[];
  telemetry?: InferenceTelemetry;
}

export type { InferenceTelemetry };

export interface InterpreterAdapter {
  readonly id: string;
  interpret(input: InterpretationInput): Promise<InterpretationResult>;
}

export async function interpret(
  input: InterpretationInput,
): Promise<InterpretationResult> {
  return GemmaInterpreterAdapter.interpret(input);
}
