import { useNavigate } from 'react-router-dom';
import { Mic, Pencil, RotateCcw, User } from 'lucide-react';
import { PillButton } from '@/components/primitives';
import { useSettings } from '@/contexts/SettingsContext';
import {
  SettingsControlCard,
  SettingsSection,
  SettingsStack,
} from '@/components/settings/SettingsShell';
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
    <SettingsStack>
      <SettingsSection title="Identity">
        <SettingsControlCard>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white">
              <User className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold tracking-tight">
                {name}
              </p>
              <p className="truncate text-xs text-muted">
                {p.pronouns ? `Pronouns: ${p.pronouns}` : 'No pronouns set'}
              </p>
            </div>
          </div>
        </SettingsControlCard>
      </SettingsSection>

      <SettingsSection title="Summary">
        <dl className="flex flex-col gap-2">
          <Stat
            label="Condition"
            value={CONDITION_LABELS[p.condition] ?? 'Not set'}
          />
          <Stat label="Caregiver" value={caregiver} />
          <Stat
            label="Voice samples"
            value={`${p.voiceSamples.length} saved`}
          />
        </dl>
      </SettingsSection>

      {p.conditionDetail ? (
        <SettingsSection title="Condition detail">
          <SettingsControlCard>
            <p className="text-xs leading-relaxed text-muted">
              {`"${p.conditionDetail}"`}
            </p>
          </SettingsControlCard>
        </SettingsSection>
      ) : null}

      {p.personalPhrases.length > 0 ? (
        <SettingsSection title="Personal phrases">
          <SettingsControlCard>
            <ul className="flex flex-wrap gap-1.5">
              {p.personalPhrases.map((phrase, i) => (
                <li
                  key={i}
                  className="rounded-full border border-black/10 bg-black/[0.03] px-2.5 py-1 text-xs font-medium text-text"
                >
                  {phrase}
                </li>
              ))}
            </ul>
          </SettingsControlCard>
        </SettingsSection>
      ) : null}

      <SettingsSection title="Actions">
        <div className="flex flex-wrap gap-2">
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
          <PillButton size="sm" variant="glass" onClick={goToPhrases}>
            Edit phrases
          </PillButton>
        </div>
        <button
          type="button"
          onClick={resetOnboarding}
          className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-2 text-xs font-medium text-red-600 transition-[background-color,transform] duration-200 ease-smooth hover:bg-red-50 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Reset onboarding & clear voice samples
        </button>
      </SettingsSection>
    </SettingsStack>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl2 border border-black/10 bg-white/70 px-3 py-2.5 shadow-sm">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium leading-snug text-text">{value}</dd>
    </div>
  );
}
