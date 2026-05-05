export interface HandoverNote {
  id: string;
  shiftStart: number;
  shiftEnd: number;
  summary: string;
  notableEvents: string[];
  newSignalsLearned: Array<{ entryId: string; meaning: string }>;
  patternsDetected: string[];
  flagsForNextCarer: string[];
  suggestedFollowUps: string[];
  /** What helped today: pace, symbols vs speech, successful phrasing. */
  communicationNotes: string[];
  /** Non-clinical operational hints for the next shift. */
  accessibilityFlagsForNextCarer: string[];
  /** Short lines in the resident's voice tone for continuity. */
  residentPhrasedPriorities: string[];
}

export type HandoverToolStatus = 'called' | 'completed' | 'failed';

export interface HandoverToolEvent {
  id: string;
  ts: number;
  toolName: string;
  status: HandoverToolStatus;
  summary: string;
}

export type HandoverNoteExportSchema = 'relay.handoverNote.v1' | 'relay.handoverNote.v2';

export interface HandoverNoteExport {
  schema: HandoverNoteExportSchema;
  exportedAt: string;
  note: HandoverNote;
}
