import { Card } from '@/components/primitives';
import { useSettings } from '@/contexts/SettingsContext';
import { useSession } from '@/contexts/SessionContext';

const LANGS = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'es-ES', label: 'Español' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'de-DE', label: 'Deutsch' },
  { code: 'ar-EG', label: 'العربية' },
  { code: 'hi-IN', label: 'हिन्दी' },
];

export function LanguagePanel() {
  const { settings, dispatch } = useSettings();
  const { state } = useSession();

  return (
    <Card className="space-y-4">
      <p className="text-sm font-semibold">Language</p>
      <div className="rounded-xl2 bg-white/70 p-3 text-sm">
        <p className="text-muted">Auto-detected primary language</p>
        <p className="mt-0.5 font-medium">
          {state.detectedLanguage}
          <span className="ms-1 text-muted">
            ({state.direction.toUpperCase()})
          </span>
        </p>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block text-muted">Primary language</span>
        <select
          value={settings.language.primaryLanguage}
          onChange={(e) =>
            dispatch({ type: 'SET_PRIMARY_LANGUAGE', value: e.target.value })
          }
          className="w-full rounded-full bg-white/70 px-4 py-3 text-base focus:outline-none"
        >
          {LANGS.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-muted">Caregiver language</span>
        <select
          value={settings.language.caregiverLanguage}
          onChange={(e) =>
            dispatch({ type: 'SET_CAREGIVER_LANGUAGE', value: e.target.value })
          }
          className="w-full rounded-full bg-white/70 px-4 py-3 text-base focus:outline-none"
        >
          {LANGS.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </label>
    </Card>
  );
}
