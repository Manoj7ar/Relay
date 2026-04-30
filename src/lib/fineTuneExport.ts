import { listEntries } from '@/lib/patientDictionary';
import { load } from '@/lib/storage';
import type { InteractionRecord } from '@/types/session';

const HISTORY_KEY = 'relay.session.history';

function jsonl(value: unknown): string {
  return `${JSON.stringify(value)}\n`;
}

export async function exportFineTuneJsonl(): Promise<string> {
  const history = load<InteractionRecord[]>(HISTORY_KEY, []);
  const dictionary = await listEntries({ recent: true });

  let out = '';
  for (const record of history) {
    const user = record.rawTranscript ?? record.sourceFragment;
    if (!user || !record.primary) continue;
    out += jsonl({
      messages: [
        {
          role: 'system',
          content:
            'Clarify speech-impaired patient intent for a caregiver. Return a concise, respectful phrase.',
        },
        { role: 'user', content: user },
        { role: 'assistant', content: record.primary },
      ],
      metadata: {
        source: 'relay-session-history',
        inputType: record.inputType,
        urgency: record.urgency,
        mood: record.mood,
        model: record.model,
        cameraUsed: record.cameraUsed,
      },
    });
  }

  for (const entry of dictionary) {
    if (!entry.rawTranscript || !entry.meaning) continue;
    out += jsonl({
      messages: [
        {
          role: 'system',
          content:
            'Map this patient-specific signal to its intended meaning. Use the local dictionary as ground truth.',
        },
        { role: 'user', content: entry.rawTranscript },
        { role: 'assistant', content: entry.meaning },
      ],
      metadata: {
        source: 'relay-patient-dictionary',
        modality: entry.modality,
        tags: entry.contextTags,
        confirmations: entry.confirmations,
      },
    });
  }

  return out;
}
