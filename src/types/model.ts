export type ModelId = 'E2B' | 'E4B' | '27B';

export type InputType = 'speech' | 'symbols' | 'vision+speech' | 'text' | 'compound';

export type Urgency = 'LOW' | 'NORMAL' | 'HIGH';

export type Mood = 'calm' | 'distressed' | 'frustrated' | 'in-pain';

export type InferenceSpeakerRole = 'patient' | 'caregiver';

/** Token / timing readout from local Ollama for the interpretation card pill. */
export interface InferenceTelemetry {
  provider: 'ollama';
  /** Model id string, e.g. Ollama image tag. */
  modelLabel: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  /** Generation time only (excludes prompt eval), in ms. */
  completionMs?: number;
  /** Wall-clock from request start to last byte, in ms. */
  wallClockMs: number;
  /** Output tokens per second when completion timing is available. */
  tokensPerSecond?: number;
  /** Token counts inferred from prompt/output length when the provider omitted usage. */
  tokenCountsApproximate?: boolean;
}

export interface InferenceRequest {
  inputType: InputType;
  transcript?: string;
  symbols?: string[];
  symbolIds?: string[];
  imageRef?: string;
  imageDataUrl?: string;
  audioDataUrl?: string;
  gestureHints?: string[];
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  language?: string;
  patientLanguage?: string;
  caregiverLanguage?: string;
  speakerRole?: InferenceSpeakerRole;
  visionOn?: boolean;
  urgencyHint?: Urgency;
  /** Board / menu / schedule photo mode (structured environment output). */
  environmentHelper?: boolean;
}

export interface Interpretation {
  id: string;
  ts: number;
  primary: string;
  patientLanguageText?: string;
  caregiverLanguageText?: string;
  alternates: string[];
  confidence: number;
  urgency: Urgency;
  mood: Mood;
  detectedLanguage: string;
  translation?: string;
  /** BCP-47 tag used for TTS of `primary` (listener-facing). */
  ttsLang?: string;
  bilingualAmbiguous?: boolean;
  model: ModelId;
  latencyMs: number;
  inputType: InputType;
  visionUsed: boolean;
  dictionaryMatchIds: string[];
  contributingChannels: string[];
  /** Optional note after caregiver action (e.g. "Confirmed", "Dismissed"). */
  actionTaken?: string;
  /** Raw user-facing input fragment for display in caregiver history. */
  sourceFragment?: string;
  /** Who spoke for this turn (model + heuristics + session); used for follow-on STT and prompts. */
  inferredSpeaker?: InferenceSpeakerRole;
  environmentScan?: boolean;
  environmentSummary?: string;
  environmentSuggestedPhrases?: string[];
  environmentScheduleHints?: string[];
  telemetry?: InferenceTelemetry;
}

export interface RoutingLogEntry {
  id: string;
  ts: number;
  inputType: InputType | 'tool';
  model: ModelId;
  latencyMs: number;
  reason: string;
  visionUsed: boolean;
  toolName?: string;
}

export interface ModelLabel {
  id: ModelId;
  label: string;
  description: string;
}

export const MODEL_LABELS: Record<ModelId, ModelLabel> = {
  E2B: {
    id: 'E2B',
    label: 'E2B — real time',
    description: 'Low-latency local inference for short phrases.',
  },
  E4B: {
    id: 'E4B',
    label: 'E4B — fine-tuned',
    description: 'Personalized speech and phrase expansion.',
  },
  '27B': {
    id: '27B',
    label: '27B — reasoning',
    description: 'Multimodal and high-stakes reasoning.',
  },
};
