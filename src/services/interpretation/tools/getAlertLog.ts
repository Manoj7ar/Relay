import type { EmptyArgs, RelayTool } from './types';
import type { InteractionRecord } from '@/types/session';

export const getAlertLog: RelayTool<EmptyArgs, InteractionRecord[]> = {
  name: 'get_alert_log',
  description:
    'Read high-urgency (HIGH) patient interactions recorded in the current shift window.',
  schema: { type: 'object', properties: {} },
  handler: async (_args, context) =>
    context.sessionHistory
      .filter(
        (record) =>
          record.ts >= context.shiftStart &&
          record.ts <= context.shiftEnd &&
          record.urgency === 'HIGH',
      )
      .sort((a, b) => a.ts - b.ts),
};
