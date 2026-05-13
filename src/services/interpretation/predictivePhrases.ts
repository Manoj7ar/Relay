import type { PredictivePhrasesPayload } from '@/types/relayAi';
import { completeOllamaJsonTask, parseOllamaJsonObject } from './ollamaJson';

const MAX_PHRASES = 3;
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
  return out.slice(0, MAX_PHRASES);
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
  /** Live speech partial while the mic is on — rank phrases as likely *next* completions. */
  partialTranscript?: string;
}): Promise<string[]> {
  const personal =
    input.personalPhrases.length > 0
      ? input.personalPhrases.map((p) => `"${p}"`).join(', ')
      : '(none)';

  const prompt = `You suggest short next things a non-speaking or speech-impaired resident might want to say to staff or family.
Output ONLY valid JSON: {"phrases":["..."]}
Rules:
- Exactly ${MAX_PHRASES} items in "phrases", ranked: index 0 = most likely next thing they would say
- Each phrase under ${MAX_LEN} characters, full sentence or clear request, warm and practical
- No medical diagnosis or medication instructions
- Deduplicate; do not repeat the last line verbatim
- Mix personal shortcuts when relevant
- If a partial transcript is given, treat it as what they are currently saying out loud; phrase 0 should feel like the best continuation or completion, not a random topic change

Time of day: ${input.timeOfDay}
Patient language (BCP-47): ${input.patientLanguage}
Caregiver language: ${input.caregiverLanguage}
Personal phrase shortcuts: ${personal}
Last interpreted line for listener: ${input.lastPrimary?.trim() || '(none)'}
Last mood: ${input.lastMood ?? 'unknown'}, urgency: ${input.lastUrgency ?? 'unknown'}
Currently speaking (live partial, may be incomplete): ${input.partialTranscript?.trim() || '(not speaking / no partial yet)'}

${input.conversationTail.trim() || 'No recent exchanges.'}

Return {"phrases":[...]} only.`;

  const payload = await completeOllamaJsonTask<PredictivePhrasesPayload>({
    prompt,
    tier: 'E2B',
    numPredict: 220,
    temperature: 0.35,
    parse: (raw) => {
      const obj = parseOllamaJsonObject<{ phrases?: unknown }>(raw);
      return { phrases: clampPhrases(obj.phrases) };
    },
  });

  return payload.phrases;
}
