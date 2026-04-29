import type { Interpretation } from './model';
import type { SessionInterpretationError } from './interpretationError';
import type { InterpretationSourceType } from '@/services/interpretationService';

export interface InteractionRecord extends Interpretation {
  cancelled?: boolean;
  /** Raw input fragment (transcript / typed / symbol label). */
  rawTranscript?: string;
  spoken?: boolean;
  cameraUsed?: boolean;
  sourceType?: InterpretationSourceType;
  symbolIds?: string[];
  imageDataUrl?: string;
}

export interface PendingImageContext {
  dataUrl: string;
  capturedAt: number;
}

export interface LastInputSnapshot {
  ts: number;
  sourceType: InterpretationSourceType;
  transcript?: string;
  symbols?: string[];
  symbolIds?: string[];
  imageDataUrl?: string;
  contributingChannels: string[];
}

export interface SessionState {
  isListening: boolean;
  isProcessing: boolean;
  currentInterpretation: Interpretation | null;
  history: InteractionRecord[];
  visionOn: boolean;
  /**
   * Last inferred speaker for this session (patient vs caregiver). Drives STT
   * locale hints and model continuity — not biometric voice ID.
   */
  sessionInferredSpeaker: 'patient' | 'caregiver' | null;
  detectedLanguage: string;
  direction: 'ltr' | 'rtl';
  /** Live speech-to-text partial transcript while listening. */
  interimTranscript: string;
  /** Last captured frame awaiting the next interpretation call. */
  pendingImage: PendingImageContext | null;
  /** Last successful input payload, kept in memory for save-as-signal flows. */
  lastInputSnapshot: LastInputSnapshot | null;
  /** Last interpretation error (title + hint; optional technical in UI). */
  lastError: SessionInterpretationError | null;
}
