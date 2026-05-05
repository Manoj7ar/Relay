import { GemmaNotConnectedError } from '@/lib/ollamaConfig';
import type { BilingualCoachPayload } from '@/types/relayAi';
import { completeOllamaJsonTask, parseOllamaJsonObject } from './ollamaApi';

export async function fetchBilingualCoachQuestion(input: {
  patientLanguage: string;
  caregiverLanguage: string;
  primaryLine: string;
  partnerLine?: string;
}): Promise<string | null> {
  if (!String(import.meta.env.VITE_RELAY_OLLAMA_BASE_URL ?? '').trim()) {
    throw new GemmaNotConnectedError();
  }

  const payload = await completeOllamaJsonTask<BilingualCoachPayload>({
    maxTokens: 120,
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content:
          'You help when two languages are configured and Relay is unsure which was spoken. Output ONLY JSON: {"question":"..."} — one short clarifying question the listener can ask (no diagnosis, under 140 chars).',
      },
      {
        role: 'user',
        content: `Patient language tag: ${input.patientLanguage}
Caregiver language tag: ${input.caregiverLanguage}
Resident-facing line: ${input.primaryLine}
Partner line (if any): ${input.partnerLine ?? '(none)'}

Return {"question":"..."}.`,
      },
    ],
    parse: (raw) => {
      const o = parseOllamaJsonObject<{ question?: unknown }>(raw);
      const q =
        typeof o.question === 'string' && o.question.trim()
          ? o.question.trim().slice(0, 200)
          : '';
      return { question: q };
    },
  });

  return payload.question || null;
}
