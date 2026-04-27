import type { RelayTool, SessionHistoryArgs } from './types';
import type { InteractionRecord } from '@/types/session';

export const getSessionHistory: RelayTool<
  SessionHistoryArgs,
  InteractionRecord[]
> = {
  name: 'get_session_history',
  description: 'Read patient interpretation history within the requested shift window.',
  schema: {
    type: 'object',
    properties: {
      since: { type: 'number', description: 'Unix timestamp in milliseconds.' },
      until: { type: 'number', description: 'Unix timestamp in milliseconds.' },
    },
  },
  handler: async (args, context) => {
    const since = args.since ?? context.shiftStart;
    const until = args.until ?? context.shiftEnd;
    return context.sessionHistory
      .filter((record) => record.ts >= since && record.ts <= until)
      .sort((a, b) => a.ts - b.ts);
  },
};
