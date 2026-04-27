import type { EmptyArgs, RelayTool } from './types';
import type { RoutingLogEntry } from '@/types/model';

export const getRoutingLog: RelayTool<EmptyArgs, RoutingLogEntry[]> = {
  name: 'get_routing_log',
  description: 'Read model routing and tool invocation audit entries for the shift.',
  schema: { type: 'object', properties: {} },
  handler: async (_args, context) =>
    context.routingLog
      .filter((entry) => entry.ts >= context.shiftStart && entry.ts <= context.shiftEnd)
      .sort((a, b) => a.ts - b.ts),
};
