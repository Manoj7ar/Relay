import { GemmaNotConnectedError } from '@/lib/ollamaConfig';
import type { InteractionRecord } from '@/types/session';
import type { SessionInsightPayload } from '@/types/relayAi';
import { completeOllamaJsonTask, parseOllamaJsonObject } from '@/services/interpretation/ollamaApi';

function linesFromToday(records: InteractionRecord[], max = 12): string {
  const slice = records.slice(0, max);
  return slice
    .map(
      (r) =>
        `- [${r.urgency}] [${r.mood}] ${r.inferredSpeaker ?? '?'}: "${(r.primary ?? '').slice(0, 140)}"`,
    )
    .join('\n');
}

function clampStrings(arr: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(arr)) return [];
  const out: string[] = [];
  for (const x of arr) {
    if (typeof x !== 'string') continue;
    const t = x.trim();
    if (!t) continue;
    out.push(t.length > maxLen ? `${t.slice(0, maxLen - 1)}…` : t);
    if (out.length >= maxItems) break;
  }
  return out;
}

export async function generateSessionInsight(input: {
  today: InteractionRecord[];
  highUrgencyCount: number;
  distressSummary?: string;
}): Promise<SessionInsightPayload> {
  if (!String(import.meta.env.VITE_RELAY_OLLAMA_BASE_URL ?? '').trim()) {
    throw new GemmaNotConnectedError();
  }

  const lines = linesFromToday(input.today);

  return completeOllamaJsonTask<SessionInsightPayload>({
    maxTokens: 400,
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content: `You help nurses and family understand a resident's communication session from short interpreted lines.
Return ONLY valid JSON with keys: headline (string), watchFor (array of strings), suggestedQuestions (array), continuity (array), disclaimer (string).
Rules:
- Non-diagnostic: no medical labels, no medication dosing, no diagnoses
- Practical, respectful, concise bullets
- disclaimer must state observations are from Relay interpretations, not clinical assessment
- If there is no data, still return helpful generic continuity (e.g. "No interpretations yet today")`,
      },
      {
        role: 'user',
        content: `Today's interpreted lines (newest first, truncated):
${lines || '(none yet)'}

Count of HIGH urgency lines today: ${input.highUrgencyCount}
Distress heuristic summary: ${input.distressSummary?.trim() || '(none)'}

Produce the JSON object.`,
      },
    ],
    parse: (raw) => {
      const o = parseOllamaJsonObject<Record<string, unknown>>(raw);
      const headline =
        typeof o.headline === 'string' && o.headline.trim()
          ? o.headline.trim().slice(0, 200)
          : 'Session overview';
      return {
        headline,
        watchFor: clampStrings(o.watchFor, 5, 120),
        suggestedQuestions: clampStrings(o.suggestedQuestions, 5, 120),
        continuity: clampStrings(o.continuity, 5, 120),
        disclaimer:
          typeof o.disclaimer === 'string' && o.disclaimer.trim()
            ? o.disclaimer.trim().slice(0, 400)
            : 'Relay summaries are based on interpreted communication only, not clinical assessment.',
      };
    },
  });
}
