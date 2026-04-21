export type ModelId = 'E2B' | 'E4B' | '27B';

export type InputType = 'speech' | 'symbols' | 'vision+speech' | 'text';

export type Urgency = 'LOW' | 'NORMAL' | 'HIGH';

export type Mood = 'calm' | 'distressed' | 'frustrated' | 'in-pain';

export interface InferenceRequest {
  inputType: InputType;
  transcript?: string;
  symbols?: string[];
  imageRef?: string;
  language?: string;
  visionOn?: boolean;
  urgencyHint?: Urgency;
}

export interface Interpretation {
  id: string;
  ts: number;
  primary: string;
  alternates: string[];
  confidence: number;
  urgency: Urgency;
  mood: Mood;
  detectedLanguage: string;
  translation?: string;
  model: ModelId;
  latencyMs: number;
  inputType: InputType;
  visionUsed: boolean;
  /** Action summary once executed (e.g. "Spoken only", "Emergency call triggered"). */
  actionTaken?: string;
  /** Raw user-facing input fragment for display in caregiver history. */
  sourceFragment?: string;
}

export interface RoutingLogEntry {
  id: string;
  ts: number;
  inputType: InputType;
  model: ModelId;
  latencyMs: number;
  reason: string;
  visionUsed: boolean;
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
