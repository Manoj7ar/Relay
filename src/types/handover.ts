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
}

export type HandoverToolStatus = 'called' | 'completed' | 'failed';

export interface HandoverToolEvent {
  id: string;
  ts: number;
  toolName: string;
  status: HandoverToolStatus;
  summary: string;
}

export interface HandoverNoteExport {
  schema: 'relay.handoverNote.v1';
  exportedAt: string;
  note: HandoverNote;
}
