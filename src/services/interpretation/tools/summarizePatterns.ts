import type { EmptyArgs, RelayTool } from './types';

function hourBucket(ts: number): string {
  const date = new Date(ts);
  const start = date.getHours().toString().padStart(2, '0');
  const end = ((date.getHours() + 1) % 24).toString().padStart(2, '0');
  return `${start}:00-${end}:00`;
}

export const summarizePatterns: RelayTool<EmptyArgs, string[]> = {
  name: 'summarize_patterns',
  description:
    'Detect simple non-LLM shift patterns such as repeated distress or common requests.',
  schema: { type: 'object', properties: {} },
  handler: async (_args, context) => {
    const records = context.sessionHistory.filter(
      (record) => record.ts >= context.shiftStart && record.ts <= context.shiftEnd,
    );
    const patterns: string[] = [];

    const highByHour = records
      .filter((record) => record.urgency === 'HIGH')
      .reduce<Record<string, number>>((acc, record) => {
        const bucket = hourBucket(record.ts);
        acc[bucket] = (acc[bucket] ?? 0) + 1;
        return acc;
      }, {});
    Object.entries(highByHour).forEach(([bucket, count]) => {
      if (count >= 2) {
        patterns.push(`${count} high-urgency events occurred between ${bucket}.`);
      }
    });

    const meanings = records.reduce<Record<string, number>>((acc, record) => {
      const key = record.primary.toLowerCase();
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    Object.entries(meanings).forEach(([meaning, count]) => {
      if (count >= 3) {
        patterns.push(`Repeated request: "${meaning}" appeared ${count} times.`);
      }
    });

    const dictionaryHits = records.filter((record) => {
      const ids = record.dictionaryMatchIds ?? [];
      return ids.length > 0;
    }).length;
    if (dictionaryHits > 0) {
      patterns.push(
        `${dictionaryHits} interaction${dictionaryHits === 1 ? '' : 's'} used the patient dictionary.`,
      );
    }

    return patterns;
  },
};
