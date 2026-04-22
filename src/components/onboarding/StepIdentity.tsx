import type { ChangeEvent } from 'react';
import type { ProfileSettings, SetupRole } from '@/types/settings';

interface StepIdentityProps {
  setupRole: SetupRole;
  profile: Pick<ProfileSettings, 'displayName' | 'fullName' | 'pronouns'>;
  onField: (
    field: 'displayName' | 'fullName' | 'pronouns',
    value: string,
  ) => void;
}

const PRONOUNS = ['she/her', 'he/him', 'they/them', 'other / custom'];

export function StepIdentity({
  setupRole,
  profile,
  onField,
}: StepIdentityProps) {
  const isSelf = setupRole === 'patient';

  const bind =
    (field: 'displayName' | 'fullName' | 'pronouns') =>
    (e: ChangeEvent<HTMLInputElement>) =>
      onField(field, e.target.value);

  const copy = isSelf
    ? {
        nickLabel: 'What should we call you?',
        nickHint: 'This shows on your home screen and in the greeting.',
        nickPh: 'e.g. Maya',
        fullLabel: 'Your full name (optional)',
        fullHint: 'Used on handover notes shared with caregivers.',
        fullPh: 'Maya Singh',
        pronounLabel: 'Your pronouns',
      }
    : {
        nickLabel: 'What do they go by?',
        nickHint: 'Used everywhere Relay greets them.',
        nickPh: 'e.g. Dad, Maya',
        fullLabel: 'Their full name (optional)',
        fullHint: 'Used on handover notes.',
        fullPh: 'Maya Singh',
        pronounLabel: 'Their pronouns',
      };

  const chipSelected = (v: string) => {
    if (v === 'other / custom') return !PRONOUNS.includes(profile.pronouns) && profile.pronouns !== '';
    return profile.pronouns === v;
  };

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">
          {copy.nickLabel}
        </span>
        <input
          type="text"
          inputMode="text"
          autoCapitalize="words"
          autoComplete="given-name"
          value={profile.displayName}
          onChange={bind('displayName')}
          placeholder={copy.nickPh}
          className="control-input text-base"
          aria-describedby="nick-hint"
        />
        <span
          id="nick-hint"
          className="mt-1 block text-[11px] leading-snug text-muted"
        >
          {copy.nickHint}
        </span>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">
          {copy.fullLabel}
        </span>
        <input
          type="text"
          autoCapitalize="words"
          autoComplete="name"
          value={profile.fullName}
          onChange={bind('fullName')}
          placeholder={copy.fullPh}
          className="control-input text-base"
          aria-describedby="full-hint"
        />
        <span
          id="full-hint"
          className="mt-1 block text-[11px] leading-snug text-muted"
        >
          {copy.fullHint}
        </span>
      </label>

      <div>
        <span className="mb-1.5 block text-sm font-medium">
          {copy.pronounLabel}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PRONOUNS.map((p) => {
            const selected = chipSelected(p);
            return (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() =>
                  onField('pronouns', p === 'other / custom' ? '' : p)
                }
                className={
                  selected
                    ? 'min-h-[40px] rounded-full border border-[var(--accent)]/60 bg-[var(--accent)]/[0.1] px-3 py-1.5 text-sm font-medium text-text shadow-sm transition-[background-color,transform] duration-200 ease-smooth active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100'
                    : 'min-h-[40px] rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-sm font-medium text-muted transition-[background-color,transform] duration-200 ease-smooth hover:bg-white active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100'
                }
              >
                {p}
              </button>
            );
          })}
        </div>
        {!PRONOUNS.slice(0, 3).includes(profile.pronouns) ? (
          <input
            type="text"
            value={profile.pronouns}
            onChange={bind('pronouns')}
            placeholder="Type custom pronouns (optional)"
            className="control-input mt-2 text-sm"
          />
        ) : null}
      </div>
    </div>
  );
}
