import { PillButton } from '@/components/primitives';
import { useSession } from '@/contexts/SessionContext';
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

export function QuickPhrases() {
  const { submit, state } = useSession();
  const phrases = phrasesFor(hourOfDay());

  return (
    <section aria-label="Quick phrases">
      <h3 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
        Quick phrases
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {phrases.map((p) => (
          <PillButton
            key={p.id}
            size="md"
            variant="glass"
            disabled={state.isProcessing}
            onClick={() =>
              submit({ inputType: 'text', transcript: p.text })
            }
          >
            {p.label}
          </PillButton>
        ))}
      </div>
    </section>
  );
}
