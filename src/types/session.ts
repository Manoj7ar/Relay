import type { Interpretation } from './model';
import type { InterpretationSourceType } from '@/services/interpretationService';

export interface InteractionRecord extends Interpretation {
  cancelled?: boolean;
  /** Raw input fragment (transcript / typed / symbol label). */
  rawTranscript?: string;
  spoken?: boolean;
  cameraUsed?: boolean;
  sourceType?: InterpretationSourceType;
}

export interface PendingImageContext {
  dataUrl: string;
  capturedAt: number;
}

export interface SessionState {
  isListening: boolean;
  isProcessing: boolean;
  currentInterpretation: Interpretation | null;
  history: InteractionRecord[];
  visionOn: boolean;
  detectedLanguage: string;
  direction: 'ltr' | 'rtl';
  /** Live speech-to-text partial transcript while listening. */
  interimTranscript: string;
  /** Last captured frame awaiting the next interpretation call. */
  pendingImage: PendingImageContext | null;
  /** Last interpretation error surfaced to the UI (e.g. "Gemma not connected"). */
  lastError: string | null;
}
