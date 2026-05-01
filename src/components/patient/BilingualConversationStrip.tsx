import { ArrowLeftRight, Mic } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { useSession } from '@/contexts/SessionContext';
import { useHaptics } from '@/hooks/useHaptics';
import { directionFor } from '@/hooks/useRTL';
import { PRIMARY_LANGUAGE_OPTIONS, resolveLanguageDisplay } from '@/lib/relayLanguages';
import { cn } from '@/lib/cn';

export type BilingualConversationStripProps = {
  /** Flat styling for use inside the header dropdown panel */
  embedded?: boolean;
  /** When set, labels the dialog for screen readers (e.g. aria-labelledby) */
  titleId?: string;
};

export function BilingualConversationStrip({
  embedded = false,
  titleId,
}: BilingualConversationStripProps) {
  const { settings, dispatch: settingsDispatch } = useSettings();
  const { dispatch: sessionDispatch } = useSession();
  const haptics = useHaptics();
  const lang = settings.language;

  const onPrimary = (code: string) => {
    haptics('tap');
    settingsDispatch({ type: 'SET_PRIMARY_LANGUAGE', value: code });
    sessionDispatch({
      type: 'SET_LANGUAGE',
      language: code,
      direction: directionFor(code),
    });
  };

  const onCaregiver = (code: string) => {
    haptics('tap');
    settingsDispatch({ type: 'SET_CAREGIVER_LANGUAGE', value: code });
  };

  return (
    <section
      className={cn(
        'text-[clamp(10px,2.9vw,11px)]',
        embedded
          ? 'mx-0 border-0 bg-transparent px-0 py-0 shadow-none'
          : 'mx-1 rounded-xl2 border border-black/[0.06] bg-white/55 px-2 py-2 backdrop-blur-sm',
      )}
      aria-label={embedded ? undefined : 'Languages for two people'}
    >
      <p
        id={titleId}
        className="mb-1.5 px-0.5 font-semibold leading-tight text-text"
      >
        Two languages
      </p>
      <p className="mb-2 px-0.5 text-[10px] leading-snug text-muted">
        Set each person&apos;s language. Relay translates both directions.
        Auto-update changes these when the transcript clearly shows another
        language — not by recognizing voices.
      </p>
      <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] font-medium text-muted">
            Patient / guest
          </span>
          <select
            value={lang.primaryLanguage}
            onChange={(e) => onPrimary(e.target.value)}
            className="control-select max-h-40 text-xs"
          >
            {PRIMARY_LANGUAGE_OPTIONS.map((o) => (
              <option key={o.code} value={o.code}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] font-medium text-muted">
            Nurse / family / partner
          </span>
          <select
            value={lang.caregiverLanguage}
            onChange={(e) => onCaregiver(e.target.value)}
            className="control-select max-h-40 text-xs"
          >
            {PRIMARY_LANGUAGE_OPTIONS.map((o) => (
              <option key={o.code} value={o.code}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-2">
        <button
          type="button"
          onClick={() => {
            haptics('tap');
            settingsDispatch({ type: 'SWAP_CONVERSATION_LANGUAGES' });
            sessionDispatch({
              type: 'SET_LANGUAGE',
              language: lang.caregiverLanguage,
              direction: directionFor(lang.caregiverLanguage),
            });
          }}
          className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-black/10 bg-white/80 px-2.5 py-2 font-medium text-text hover:bg-white min-[380px]:min-h-9 min-[380px]:px-2 min-[380px]:py-1"
        >
          <ArrowLeftRight className="h-4 w-4 shrink-0 min-[380px]:h-3 min-[380px]:w-3" aria-hidden />
          Swap languages
        </button>
      </div>

      <p className="mt-2 px-0.5 text-[10px] font-medium text-muted">
        Who usually holds this device?
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <div className="inline-flex rounded-lg border border-black/10 p-0.5">
          <button
            type="button"
            onClick={() =>
              settingsDispatch({
                type: 'SET_DEFAULT_MIC_SPEAKER',
                value: 'patient',
              })
            }
            className={cn(
              'rounded-md px-2 py-2 font-medium min-[380px]:py-1',
              'min-h-11 min-[380px]:min-h-0',
              lang.defaultMicSpeaker === 'patient'
                ? 'bg-[var(--accent)]/20 text-text'
                : 'text-muted hover:bg-black/[0.04]',
            )}
          >
            <Mic className="-mt-0.5 me-0.5 inline h-4 w-4 min-[380px]:h-3 min-[380px]:w-3" aria-hidden />
            Patient / guest
          </button>
          <button
            type="button"
            onClick={() =>
              settingsDispatch({
                type: 'SET_DEFAULT_MIC_SPEAKER',
                value: 'caregiver',
              })
            }
            className={cn(
              'rounded-md px-2 py-2 font-medium min-[380px]:py-1',
              'min-h-11 min-[380px]:min-h-0',
              lang.defaultMicSpeaker === 'caregiver'
                ? 'bg-[var(--accent)]/20 text-text'
                : 'text-muted hover:bg-black/[0.04]',
            )}
          >
            <Mic className="-mt-0.5 me-0.5 inline h-4 w-4 min-[380px]:h-3 min-[380px]:w-3" aria-hidden />
            Other person
          </button>
        </div>
      </div>

      <label className="mt-2 flex min-h-11 cursor-pointer items-center gap-2 min-[380px]:min-h-0">
        <input
          type="checkbox"
          className="h-4 w-4 shrink-0 rounded border-black/20 min-[380px]:h-3.5 min-[380px]:w-3.5"
          checked={lang.autoAdaptLanguages}
          onChange={(e) =>
            settingsDispatch({
              type: 'SET_AUTO_ADAPT_LANGUAGES',
              value: e.target.checked,
            })
          }
        />
        <span className="text-[10px] font-medium text-muted">
          Update languages automatically when Relay is sure
        </span>
      </label>

      <p className="mt-1.5 px-0.5 text-[10px] text-muted">
        Pair in use:{' '}
        {resolveLanguageDisplay(lang.primaryLanguage).short}
        {' · '}
        {resolveLanguageDisplay(lang.caregiverLanguage).short}
      </p>
    </section>
  );
}
