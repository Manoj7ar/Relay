import { useSettings } from '@/contexts/SettingsContext';

/**
 * Shown on every main tab when Relay master power is off (flame toggle on Home).
 */
export function RelayPausedBanner() {
  const { settings, dispatch } = useSettings();
  if (settings.relayPowerOn) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="safe-x shrink-0 border-b border-black/10 bg-[var(--surface)] px-3 py-2.5 text-center"
    >
      <p className="text-xs font-medium leading-snug text-text">
        Relay is paused — voice, symbols, and typing will not send until you
        resume.
      </p>
      <button
        type="button"
        className="mt-2 rounded-full bg-[var(--accent)] px-4 py-1.5 text-xs font-semibold text-white transition-[background-color,transform] duration-fast ease-smooth hover:bg-[var(--accent-strong)] active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
        onClick={() => dispatch({ type: 'SET_RELAY_POWER_ON', value: true })}
      >
        Resume Relay
      </button>
    </div>
  );
}
