import type { ChangeEvent } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useSession } from '@/contexts/SessionContext';
import { directionFor } from '@/hooks/useRTL';
import { PRIMARY_LANGUAGE_OPTIONS } from '@/lib/relayLanguages';
import type { SetupRole } from '@/types/settings';

interface StepLangCaregiverProps {
  setupRole: SetupRole;
}

const RELATIONSHIPS = [
  'Family',
  'Spouse / partner',
  'Child',
  'Parent',
  'Friend',
  'Nurse / care team',
  'Other',
];

export function StepLangCaregiver({ setupRole }: StepLangCaregiverProps) {
  const { settings, dispatch } = useSettings();
  const { dispatch: sessionDispatch } = useSession();
  const isSelf = setupRole === 'patient';

  const setProfile = (
    field:
      | 'caregiverName'
      | 'caregiverRelationship',
    value: string,
  ) => dispatch({ type: 'SET_PROFILE_FIELD', field, value });

  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Languages
        </h2>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">
            {isSelf ? 'I speak' : 'They speak'}
          </span>
          <select
            value={settings.language.primaryLanguage}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
              const v = e.target.value;
              dispatch({ type: 'SET_PRIMARY_LANGUAGE', value: v });
              sessionDispatch({
                type: 'SET_LANGUAGE',
                language: v,
                direction: directionFor(v),
              });
            }}
            className="control-select"
          >
            {PRIMARY_LANGUAGE_OPTIONS.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">
            Caregiver / family language
          </span>
          <select
            value={settings.language.caregiverLanguage}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              dispatch({
                type: 'SET_CAREGIVER_LANGUAGE',
                value: e.target.value,
              })
            }
            className="control-select"
          >
            {PRIMARY_LANGUAGE_OPTIONS.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-[11px] leading-snug text-muted">
            We'll translate handover notes into this language.
          </span>
        </label>
      </section>

      <section className="space-y-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          {isSelf ? 'Who can we alert?' : 'Your details'}
        </h2>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">
            {isSelf ? "Caregiver's name" : 'Your name'}
          </span>
          <input
            type="text"
            autoCapitalize="words"
            autoComplete="name"
            value={settings.profile.caregiverName}
            onChange={(e) => setProfile('caregiverName', e.target.value)}
            placeholder={isSelf ? 'Priya' : 'e.g. Priya'}
            className="control-input text-base"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">
            Relationship
          </span>
          <select
            value={
              RELATIONSHIPS.includes(settings.profile.caregiverRelationship)
                ? settings.profile.caregiverRelationship
                : settings.profile.caregiverRelationship
                  ? 'Other'
                  : ''
            }
            onChange={(e) => setProfile('caregiverRelationship', e.target.value)}
            className="control-select"
          >
            <option value="">Pick one…</option>
            {RELATIONSHIPS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">
            Emergency contact phone (optional)
          </span>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={settings.integrations.caregiverPhone}
            onChange={(e) =>
              dispatch({
                type: 'SET_CAREGIVER_PHONE',
                value: e.target.value,
              })
            }
            placeholder="+15555550134"
            className="control-input text-base"
          />
          <span className="mt-1 block text-[11px] leading-snug text-muted">
            Included when Relay POSTs to your emergency proxy URL (Settings →
            Integrations).
          </span>
        </label>
      </section>
    </div>
  );
}
