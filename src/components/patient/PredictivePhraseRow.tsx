import { Sparkles } from 'lucide-react';
import { PillButton } from '@/components/primitives';
import { useSettings } from '@/contexts/SettingsContext';
import { useSession } from '@/contexts/SessionContext';
import { useHaptics } from '@/hooks/useHaptics';
import { usePredictivePhrases } from '@/hooks/usePredictivePhrases';
import { isOllamaConfigured } from '@/lib/ollamaConfig';
import { cn } from '@/lib/cn';

export function PredictivePhraseRow() {
  const { settings } = useSettings();
  const { submit } = useSession();
  const { phrases, loading } = usePredictivePhrases();
  const haptics = useHaptics();

  if (!settings.relayPowerOn) return null;

  if (phrases.length === 0 && !loading) return null;

  return (
    <section
      className="shrink-0 px-0.5"
      aria-label="Suggested next phrases"
    >
      <div className="mb-1 flex items-center gap-1 px-0.5 text-[10px] font-medium text-muted">
        <Sparkles className="h-3 w-3 shrink-0 text-[var(--accent)]" aria-hidden />
        <span>Try saying</span>
        {loading ? <span className="text-muted">· updating…</span> : null}
      </div>
      <div
        className={cn(
          'flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none',
          'motion-safe:scroll-smooth',
        )}
      >
        {phrases.map((phrase) => (
          <PillButton
            key={phrase}
            type="button"
            size="sm"
            variant="glass"
            className="shrink-0 max-w-[min(280px,85vw)] truncate whitespace-nowrap px-3 py-2 text-xs font-medium"
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
      {!isOllamaConfigured() && phrases.length > 0 ? (
        <p className="mt-1 px-0.5 text-[10px] leading-snug text-muted">
          Add VITE_RELAY_OLLAMA_BASE_URL for AI-suggested phrases; showing your shortcuts
          only.
        </p>
      ) : null}
    </section>
  );
}
