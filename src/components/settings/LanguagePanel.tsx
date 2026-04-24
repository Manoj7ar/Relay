import { Card } from '@/components/primitives';
import { useSettings } from '@/contexts/SettingsContext';
import { useSession } from '@/contexts/SessionContext';
import { directionFor } from '@/hooks/useRTL';
import { PRIMARY_LANGUAGE_OPTIONS } from '@/lib/relayLanguages';

export function LanguagePanel() {
  const { settings, dispatch } = useSettings();
  const { state, dispatch: sessionDispatch } = useSession();

  return (
    <Card padded={false} className="h-full min-h-0 space-y-2 overflow-hidden p-3">
      <p className="text-xs font-semibold">Language</p>
      <div className="rounded-xl2 bg-white/70 p-2 text-xs">
        <p className="text-muted">Auto-detected primary language</p>
        <p className="mt-0.5 font-medium">
          {state.detectedLanguage}
          <span className="ms-1 text-muted">
            ({state.direction.toUpperCase()})
          </span>
        </p>
      </div>

      <label className="block text-xs">
        <span className="mb-1 block text-muted">Primary language</span>
        <select
          value={settings.language.primaryLanguage}
          onChange={(e) => {
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

      <label className="block text-xs">
        <span className="mb-1 block text-muted">Caregiver language</span>
        <select
          value={settings.language.caregiverLanguage}
          onChange={(e) =>
            dispatch({ type: 'SET_CAREGIVER_LANGUAGE', value: e.target.value })
          }
          className="control-select"
        >
          {PRIMARY_LANGUAGE_OPTIONS.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </label>
    </Card>
  );
}
