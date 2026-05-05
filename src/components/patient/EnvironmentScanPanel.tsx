import { MapPin } from 'lucide-react';
import { PillButton } from '@/components/primitives';
import { useSession } from '@/contexts/SessionContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useHaptics } from '@/hooks/useHaptics';

/** Shows structured board/menu analysis for the latest environment scan turn. */
export function EnvironmentScanPanel() {
  const { state, submit } = useSession();
  const { settings } = useSettings();
  const haptics = useHaptics();
  const latest = state.history[0];

  if (!latest?.environmentScan) return null;

  const summary = latest.environmentSummary?.trim() ?? '';
  const phrases = latest.environmentSuggestedPhrases ?? [];
  const hints = latest.environmentScheduleHints ?? [];

  if (!summary && phrases.length === 0 && hints.length === 0) return null;

  return (
    <section
      className="shrink-0 rounded-xl2 border border-[var(--accent)]/20 bg-[var(--accent)]/[0.06] p-2.5"
      aria-label="Environment scan"
    >
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-strong)]">
        <MapPin className="h-3.5 w-3.5" aria-hidden />
        Board / schedule
      </div>
      {summary ? (
        <p className="mb-2 text-xs leading-snug text-text">{summary}</p>
      ) : null}
      {hints.length > 0 ? (
        <div className="mb-2">
          <p className="mb-0.5 text-[10px] font-medium text-muted">Times & activities</p>
          <ul className="list-inside list-disc text-[11px] leading-snug text-text">
            {hints.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {phrases.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {phrases.map((phrase) => (
            <PillButton
              key={phrase}
              type="button"
              size="sm"
              variant="glass"
              className="max-w-full shrink px-2.5 py-1.5 text-[11px] font-medium"
              title={phrase}
              onClick={() => {
                haptics('tap');
                void submit({
                  inputType: 'text',
                  transcript: phrase,
                  language: settings.language.primaryLanguage,
                  patientLanguage: settings.language.primaryLanguage,
                  caregiverLanguage: settings.language.caregiverLanguage,
                  speakerRole: 'patient',
                });
              }}
            >
              {phrase}
            </PillButton>
          ))}
        </div>
      ) : null}
      <p className="mt-2 text-[10px] leading-snug text-muted">
        Avoid photos of private medical labels. Suggestions are guesses from the image
        only.
      </p>
    </section>
  );
}
