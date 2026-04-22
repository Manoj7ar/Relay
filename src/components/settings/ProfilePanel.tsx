import { useNavigate } from 'react-router-dom';
import { Mic, Pencil, RotateCcw, User } from 'lucide-react';
import { Card, PillButton } from '@/components/primitives';
import { useSettings } from '@/contexts/SettingsContext';
import { clearAllSamples } from '@/lib/voiceSamples';

const CONDITION_LABELS: Record<string, string> = {
  als: 'ALS / MND',
  aphasia: 'Aphasia',
  dysarthria: 'Dysarthria',
  parkinson: "Parkinson's",
  other: 'Other',
  '': 'Not set',
};

export function ProfilePanel() {
  const navigate = useNavigate();
  const { settings, dispatch } = useSettings();
  const p = settings.profile;

  const name =
    p.displayName.trim() || p.fullName.trim() || 'Not set';
  const caregiver = p.caregiverName.trim()
    ? `${p.caregiverName}${p.caregiverRelationship ? ` · ${p.caregiverRelationship}` : ''}`
    : 'Not set';

  const goToOnboarding = () => navigate('/onboarding?mode=edit');
  const goToVoice = () => navigate('/onboarding?mode=edit&step=voice');
  const goToPhrases = () => navigate('/onboarding?mode=edit&step=phrases');

  const resetOnboarding = () => {
    if (!confirm('Reset onboarding and clear all saved voice samples?')) return;
    dispatch({ type: 'RESET_ONBOARDING' });
    dispatch({ type: 'CLEAR_VOICE_SAMPLES' });
    void clearAllSamples();
    navigate('/');
  };

  return (
    <Card padded={false} className="h-full min-h-0 space-y-2 overflow-y-auto p-3">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-white">
          <User className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">{name}</p>
          <p className="truncate text-[11px] text-muted">
            {p.pronouns ? `Pronouns: ${p.pronouns}` : 'No pronouns set'}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-1.5 text-[11px]">
        <Stat label="Condition" value={CONDITION_LABELS[p.condition] ?? 'Not set'} />
        <Stat label="Caregiver" value={caregiver} />
        <Stat
          label="Voice samples"
          value={`${p.voiceSamples.length} saved`}
        />
      </dl>

      {p.conditionDetail ? (
        <p className="rounded-xl2 border border-black/10 bg-white/70 p-2 text-[11px] leading-snug text-muted">
          "{p.conditionDetail}"
        </p>
      ) : null}

      {p.personalPhrases.length > 0 ? (
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
            Personal phrases
          </p>
          <ul className="flex flex-wrap gap-1">
            {p.personalPhrases.map((phrase, i) => (
              <li
                key={i}
                className="rounded-full border border-black/10 bg-white/70 px-2 py-0.5 text-[11px] text-text"
              >
                {phrase}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-1.5 pt-1">
        <PillButton
          size="sm"
          variant="accent"
          leftIcon={<Pencil className="h-4 w-4" aria-hidden />}
          onClick={goToOnboarding}
        >
          Edit profile
        </PillButton>
        <PillButton
          size="sm"
          variant="glass"
          leftIcon={<Mic className="h-4 w-4" aria-hidden />}
          onClick={goToVoice}
        >
          Re-record voice
        </PillButton>
        <PillButton
          size="sm"
          variant="glass"
          onClick={goToPhrases}
        >
          Edit phrases
        </PillButton>
      </div>

      <button
        type="button"
        onClick={resetOnboarding}
        className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-[11px] font-medium text-red-600 transition-[background-color,transform] duration-200 ease-smooth hover:bg-red-50 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden />
        Reset onboarding & clear voice samples
      </button>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl2 border border-black/10 bg-white/70 p-2">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-xs font-medium">{value}</dd>
    </div>
  );
}
