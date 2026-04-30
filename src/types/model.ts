export type ModelId = 'E2B' | 'E4B' | '27B';

export type InputType = 'speech' | 'symbols' | 'vision+speech' | 'text' | 'compound';

export type Urgency = 'LOW' | 'NORMAL' | 'HIGH';

export type Mood = 'calm' | 'distressed' | 'frustrated' | 'in-pain';

export type InferenceSpeakerRole = 'patient' | 'caregiver';

export interface InferenceRequest {
  inputType: InputType;
  transcript?: string;
  symbols?: string[];
  symbolIds?: string[];
  imageRef?: string;
  imageDataUrl?: string;
  gestureHints?: string[];
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  language?: string;
  patientLanguage?: string;
  caregiverLanguage?: string;
  speakerRole?: InferenceSpeakerRole;
  visionOn?: boolean;
  urgencyHint?: Urgency;
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
