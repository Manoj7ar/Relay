/** Shown in TranscriptionCard when interpretation fails (replaces one long string). */
export type InterpretationErrorCode =
  | 'ollama_unreachable'
  | 'speech_recognition'
  | 'unknown';

export interface SessionInterpretationError {
  code: InterpretationErrorCode;
  title: string;
  hint?: string;
  /** Optional; shown inside a collapsed "Details" disclosure. */
  technical?: string;
}
