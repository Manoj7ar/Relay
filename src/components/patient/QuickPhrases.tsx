import { useId, useState } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { useSettings } from '@/contexts/SettingsContext';
import { hourOfDay } from '@/lib/time';

interface Phrase {
  id: string;
  label: string;
  text: string;
}

const MORNING: Phrase[] = [
  { id: 'breakfast', label: 'Breakfast', text: 'I am ready for breakfast.' },
  { id: 'meds', label: 'Medication', text: 'Please bring my medication.' },
  { id: 'bathroom', label: 'Bathroom', text: 'I need to use the bathroom.' },
  { id: 'good-morning', label: 'Good morning', text: 'Good morning.' },
];

const MIDDAY: Phrase[] = [
  { id: 'water', label: 'Water', text: 'Please bring me some water.' },
  { id: 'bathroom', label: 'Bathroom', text: 'I need to use the bathroom.' },
  { id: 'lunch', label: 'Lunch', text: 'I am ready for lunch.' },
  { id: 'meds', label: 'Medication', text: 'Please bring my medication.' },
];

const AFTERNOON: Phrase[] = [
  { id: 'tv', label: 'TV', text: 'Please turn on the television.' },
  { id: 'water', label: 'Water', text: 'Please bring me some water.' },
  { id: 'cold', label: 'Cold', text: 'I feel cold. Please bring a blanket.' },
  { id: 'family', label: 'Call family', text: 'Please call my family.' },
];

const EVENING: Phrase[] = [
  { id: 'dinner', label: 'Dinner', text: 'I am ready for dinner.' },
  { id: 'meds', label: 'Medication', text: 'Please bring my medication.' },
  { id: 'sleep', label: 'Sleep', text: 'I would like to go to bed.' },
  { id: 'family', label: 'Call family', text: 'Please call my family.' },
];

function phrasesFor(hour: number): Phrase[] {
  if (hour >= 5 && hour < 11) return MORNING;
  if (hour >= 11 && hour < 15) return MIDDAY;
  if (hour >= 15 && hour < 19) return AFTERNOON;
  return EVENING;
}

const PERSONAL_PREFIX = 'personal:';

export function QuickPhrases() {
  const selectId = useId();
  const [value, setValue] = useState('');
  const { submit, state } = useSession();
  const { settings } = useSettings();
  const phrases = phrasesFor(hourOfDay());
  const personal = settings.profile.personalPhrases.filter((p) => p.trim());

  const labelFor = (raw: string) => (raw.length > 32 ? raw.slice(0, 30) + '…' : raw);

  return (
    <section aria-label="Quick phrases" className="shrink-0">
      <label
        htmlFor={selectId}
        className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted"
      >
        Quick phrase
      </label>
      <select
        id={selectId}
        className="control-select"
        value={value}
        disabled={state.isProcessing}
        aria-busy={state.isProcessing}
        onChange={(e) => {
          const id = e.target.value;
          setValue('');
          if (!id || state.isProcessing) return;

          if (id.startsWith(PERSONAL_PREFIX)) {
            const idx = Number(id.slice(PERSONAL_PREFIX.length));
            const text = personal[idx];
            if (text) {
              void submit({
                inputType: 'text',
                transcript: text,
                language: settings.language.primaryLanguage,
              });
            }
            return;
          }

          const phrase = phrases.find((p) => p.id === id);
          if (phrase) {
            void submit({
              inputType: 'text',
              transcript: phrase.text,
              language: settings.language.primaryLanguage,
            });
          }
        }}
      >
        <option value="">Choose a phrase…</option>
        {personal.length > 0 ? (
          <optgroup label="Your phrases">
            {personal.map((p, i) => (
              <option key={`${PERSONAL_PREFIX}${i}`} value={`${PERSONAL_PREFIX}${i}`}>
                {labelFor(p)}
              </option>
            ))}
          </optgroup>
        ) : null}
        <optgroup label="Suggested">
          {phrases.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </optgroup>
      </select>
    </section>
  );
}
