import { addEntry, listEntries } from '@/lib/patientDictionary';
import { interpret } from '@/services/interpretationService';
import type { NewDictionaryEntry, SignalModality } from '@/types/dictionary';
import type { ProfileSettings } from '@/types/settings';

const SEED_TAG = 'gemma-onboarding-seed';

const BASE_SEEDS: Array<{ raw: string; meaning: string; tags: string[] }> = [
  { raw: 'wa', meaning: 'I would like water, please.', tags: ['water'] },
  { raw: 'help', meaning: 'I need help, please.', tags: ['help'] },
  { raw: 'pain', meaning: 'I am in pain.', tags: ['pain', 'urgent'] },
  { raw: 'bathroom', meaning: 'I need to use the bathroom.', tags: ['bathroom'] },
  { raw: 'cold', meaning: 'I am feeling cold.', tags: ['comfort'] },
  { raw: 'hot', meaning: 'I am too warm.', tags: ['comfort'] },
  { raw: 'tired', meaning: 'I need to rest.', tags: ['rest'] },
  { raw: 'yes', meaning: 'Yes.', tags: ['yes-no'] },
  { raw: 'no', meaning: 'No.', tags: ['yes-no'] },
  { raw: 'stop', meaning: 'Please stop.', tags: ['boundary'] },
  { raw: 'again', meaning: 'Please repeat that.', tags: ['clarify'] },
  { raw: 'family', meaning: 'I want to contact family.', tags: ['social'] },
];

const CONDITION_SEEDS: Record<string, Array<{ raw: string; meaning: string }>> = {
  als: [
    { raw: 'suction', meaning: 'I need suction or airway help.' },
    { raw: 'position', meaning: 'Please help me change position.' },
    { raw: 'machine', meaning: 'Please check my breathing equipment.' },
  ],
  aphasia: [
    { raw: 'word', meaning: 'I cannot find the word right now.' },
    { raw: 'point', meaning: 'Please let me point or show you.' },
    { raw: 'slow', meaning: 'Please slow down.' },
  ],
  dysarthria: [
    { raw: 'repeat', meaning: 'Please listen again; I am trying to repeat it.' },
    { raw: 'clear', meaning: 'I need a moment to speak more clearly.' },
    { raw: 'write', meaning: 'Please let me write it instead.' },
  ],
  parkinson: [
    { raw: 'freeze', meaning: 'I feel frozen and need help moving.' },
    { raw: 'meds', meaning: 'I may need my medication.' },
    { raw: 'steady', meaning: 'Please help me steady myself.' },
  ],
};

function modalityFor(raw: string): SignalModality {
  const words = raw.trim().split(/\s+/).filter(Boolean).length;
  return words <= 2 ? 'partial_word' : 'vocalization';
}

function uniqueCandidates(profile: ProfileSettings) {
  const out = [...BASE_SEEDS];
  const conditionSeeds = CONDITION_SEEDS[profile.condition] ?? [];
  out.push(
    ...conditionSeeds.map((seed) => ({
      ...seed,
      tags: [profile.condition, 'condition'],
    })),
  );
  out.push(
    ...profile.personalPhrases
      .filter((phrase) => phrase.trim().length > 0)
      .map((phrase) => ({
        raw: phrase,
        meaning: phrase,
        tags: ['personal-phrase'],
      })),
  );
  out.push(
    ...profile.voiceSamples
      .filter((sample) => sample.transcript.trim().length > 0)
      .map((sample) => ({
        raw: sample.transcript,
        meaning: sample.prompt,
        tags: ['voice-sample'],
      })),
  );

  const seen = new Set<string>();
  return out
    .filter((seed) => {
      const key = seed.raw.trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 20);
}

export async function seedOnboardingDictionary({
  profile,
  patientLanguage,
  caregiverLanguage,
}: {
  profile: ProfileSettings;
  patientLanguage: string;
  caregiverLanguage: string;
}): Promise<number> {
  const existing = await listEntries({ recent: true });
  const existingRaw = new Set(
    existing.map((entry) => entry.rawTranscript?.trim().toLowerCase()).filter(Boolean),
  );
  if (existing.filter((entry) => entry.contextTags.includes(SEED_TAG)).length >= 8) {
    return 0;
  }

  let added = 0;
  for (const candidate of uniqueCandidates(profile)) {
    if (existingRaw.has(candidate.raw.trim().toLowerCase())) continue;
    const result = await interpret({
      sourceType: 'text',
      transcript: `Create a patient dictionary entry. Patient condition: ${
        profile.condition || 'not specified'
      }. Detail: ${profile.conditionDetail || 'none'}. Raw signal: "${
        candidate.raw
      }". Baseline meaning: "${candidate.meaning}". Return the concise clarified patient-facing sentence as the main intent.`,
      patientLanguage,
      caregiverLanguage,
      language: patientLanguage,
      speakerRole: 'patient',
    });
    const entry: NewDictionaryEntry = {
      modality: modalityFor(candidate.raw),
      rawTranscript: candidate.raw,
      meaning: result.patientLanguageText || result.primaryText || candidate.meaning,
      contextTags: [
        SEED_TAG,
        'candidate',
        ...candidate.tags,
        ...(profile.condition ? [profile.condition] : []),
      ],
      confirmedBy: 'gemma-onboarding',
      confirmations: 1,
    };
    await addEntry(entry);
    added += 1;
  }
  return added;
}
