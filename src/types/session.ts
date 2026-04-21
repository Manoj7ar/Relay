import type { Interpretation } from './model';

export interface InteractionRecord extends Interpretation {
  cancelled?: boolean;
}

export interface SessionState {
  isListening: boolean;
  isProcessing: boolean;
  currentInterpretation: Interpretation | null;
  history: InteractionRecord[];
  visionOn: boolean;
  detectedLanguage: string;
  direction: 'ltr' | 'rtl';
}
