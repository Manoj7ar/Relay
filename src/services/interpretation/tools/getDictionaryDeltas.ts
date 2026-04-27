import { listEntries } from '@/lib/patientDictionary';
import type { DictionaryEntry } from '@/types/dictionary';
import type { DictionaryDeltasArgs, RelayTool } from './types';

export const getDictionaryDeltas: RelayTool<
  DictionaryDeltasArgs,
  DictionaryEntry[]
> = {
  name: 'get_dictionary_deltas',
  description: 'Return patient dictionary entries created or updated since a timestamp.',
  schema: {
    type: 'object',
    required: ['since'],
    properties: {
      since: { type: 'number', description: 'Unix timestamp in milliseconds.' },
    },
  },
  handler: async (args) => {
    const entries = await listEntries({ recent: true });
    return entries.filter(
      (entry) => entry.createdAt >= args.since || entry.lastSeenAt >= args.since,
    );
  },
};
