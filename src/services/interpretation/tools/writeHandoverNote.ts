import { putHandoverNote } from '@/lib/handoverNotes';
import { uid } from '@/lib/id';
import type { HandoverNote } from '@/types/handover';
import type { RelayTool, WriteHandoverNoteArgs } from './types';

function toStringArray(value: string[]): string[] {
  return value.map((item) => item.trim()).filter(Boolean);
}

export const writeHandoverNote: RelayTool<
  WriteHandoverNoteArgs,
  HandoverNote
> = {
  name: 'write_handover_note',
  description: 'Persist the final structured Relay handover note in local IndexedDB.',
  schema: {
    type: 'object',
    required: [
      'shiftStart',
      'shiftEnd',
      'summary',
      'notableEvents',
      'newSignalsLearned',
      'patternsDetected',
      'flagsForNextCarer',
      'suggestedFollowUps',
      'communicationNotes',
      'accessibilityFlagsForNextCarer',
      'residentPhrasedPriorities',
    ],
    properties: {
      shiftStart: { type: 'number' },
      shiftEnd: { type: 'number' },
      summary: { type: 'string' },
      notableEvents: { type: 'array', items: { type: 'string' } },
      newSignalsLearned: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            entryId: { type: 'string' },
            meaning: { type: 'string' },
          },
        },
      },
      patternsDetected: { type: 'array', items: { type: 'string' } },
      flagsForNextCarer: { type: 'array', items: { type: 'string' } },
      suggestedFollowUps: { type: 'array', items: { type: 'string' } },
      communicationNotes: { type: 'array', items: { type: 'string' } },
      accessibilityFlagsForNextCarer: {
        type: 'array',
        items: { type: 'string' },
      },
      residentPhrasedPriorities: { type: 'array', items: { type: 'string' } },
    },
  },
  handler: async (args, context) => {
    const note: HandoverNote = {
      id: args.id ?? uid('handover'),
      shiftStart: args.shiftStart || context.shiftStart,
      shiftEnd: args.shiftEnd || context.shiftEnd,
      summary: args.summary.trim(),
      notableEvents: toStringArray(args.notableEvents),
      newSignalsLearned: args.newSignalsLearned.map((signal) => ({
        entryId: signal.entryId,
        meaning: signal.meaning,
      })),
      patternsDetected: toStringArray(args.patternsDetected),
      flagsForNextCarer: toStringArray(args.flagsForNextCarer),
      suggestedFollowUps: toStringArray(args.suggestedFollowUps),
      communicationNotes: toStringArray(args.communicationNotes),
      accessibilityFlagsForNextCarer: toStringArray(
        args.accessibilityFlagsForNextCarer,
      ),
      residentPhrasedPriorities: toStringArray(args.residentPhrasedPriorities),
    };
    return putHandoverNote(note);
  },
};
