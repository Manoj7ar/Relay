import type { DictionaryEntry } from '@/types/dictionary';
import type { HandoverNote } from '@/types/handover';
import type { RoutingLogEntry } from '@/types/model';
import type { InteractionRecord } from '@/types/session';

export type JsonSchema = Record<string, unknown>;

export interface RelayTool<TArgs, TResult> {
  name: string;
  description: string;
  schema: JsonSchema;
  handler: (args: TArgs, context: RelayToolContext) => Promise<TResult>;
}

export interface RelayToolContext {
  shiftStart: number;
  shiftEnd: number;
  sessionHistory: InteractionRecord[];
  routingLog: RoutingLogEntry[];
}

export interface SessionHistoryArgs {
  since?: number;
  until?: number;
}

export interface DictionaryDeltasArgs {
  since: number;
}

export interface EmptyArgs {
  [key: string]: never;
}

export interface WriteHandoverNoteArgs extends Omit<HandoverNote, 'id'> {
  id?: string;
}

export interface HandoverToolResults {
  sessionHistory: InteractionRecord[];
  dictionaryDeltas: DictionaryEntry[];
  alertLog: InteractionRecord[];
  routingLog: RoutingLogEntry[];
  patterns: string[];
  note: HandoverNote;
}
