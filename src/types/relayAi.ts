/** Local Ollama JSON task: predictive phrase chips on patient home. */
export interface PredictivePhrasesPayload {
  phrases: string[];
}

/** Local Ollama JSON task: caregiver session insight card. */
export interface SessionInsightPayload {
  headline: string;
  watchFor: string[];
  suggestedQuestions: string[];
  continuity: string[];
  disclaimer: string;
}

/** Local Ollama JSON task: one clarifying question when language is ambiguous. */
export interface BilingualCoachPayload {
  question: string;
}

/** Extended interpretation fields for board / menu photo mode. */
export interface EnvironmentScanPayload {
  environmentSummary: string;
  environmentSuggestedPhrases: string[];
  environmentScheduleHints: string[];
}
