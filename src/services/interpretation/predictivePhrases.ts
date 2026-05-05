import { GemmaNotConnectedError } from '@/lib/ollamaConfig';
import type { PredictivePhrasesPayload } from '@/types/relayAi';
import { completeOllamaJsonTask, parseOllamaJsonObject } from './ollamaApi';

const MAX_PHRASES = 5;
const MAX_LEN = 72;

function clampPhrases(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') continue;
    const t = item.trim().replace(/\s+/g, ' ');
    if (!t) continue;
    out.push(t.length > MAX_LEN ? `${t.slice(0, MAX_LEN - 1)}…` : t);
    if (out.length >= MAX_PHRASES) break;
  }
  return out;
}

export async function fetchPredictivePhrases(input: {
  conversationTail: string;
  lastPrimary?: string;
  lastMood?: string;
  lastUrgency?: string;
  personalPhrases: string[];
  patientLanguage: string;
  caregiverLanguage: string;
  timeOfDay: string;
}): Promise<string[]> {
  if (!String(import.meta.env.VITE_RELAY_OLLAMA_BASE_URL ?? '').trim()) {
    throw new GemmaNotConnectedError();
  }

  const personal =
    input.personalPhrases.length > 0
      ? input.personalPhrases.map((p) => `"${p}"`).join(', ')
      : '(none)';

  const payload = await completeOllamaJsonTask<PredictivePhrasesPayload>({
    maxTokens: 220,
    temperature: 0.35,
    messages: [
      {
        role: 'system',
        content: `You suggest short next things a non-speaking or speech-impaired resident might want to say to staff or family.
Output ONLY valid JSON: {"phrases":["..."]}
Rules:
- 3 to ${MAX_PHRASES} items in "phrases"
- Each phrase under ${MAX_LEN} characters, full sentence or clear request, warm and practical
- No medical diagnosis or medication instructions
- Deduplicate; do not repeat the last line verbatim
- Mix personal shortcuts when relevant`,
      },
      {
        role: 'user',
        content: `Time of day: ${input.timeOfDay}
Patient language (BCP-47): ${input.patientLanguage}
Caregiver language: ${input.caregiverLanguage}
Personal phrase shortcuts: ${personal}
Last interpreted line for listener: ${input.lastPrimary?.trim() || '(none)'}
Last mood: ${input.lastMood ?? 'unknown'}, urgency: ${input.lastUrgency ?? 'unknown'}

${input.conversationTail.trim() || 'No recent exchanges.'}

Return {"phrases":[...]} only.`,
      },
    ],
    parse: (raw) => {
      const obj = parseOllamaJsonObject<{ phrases?: unknown }>(raw);
      return { phrases: clampPhrases(obj.phrases) };
    },
  });

  return payload.phrases;
}
