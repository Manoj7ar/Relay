import { Flame } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useSettings } from '@/contexts/SettingsContext';
import { useHaptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/cn';

export function TopStatusBar() {
  const { settings, dispatch } = useSettings();
  const haptics = useHaptics();
  const on = settings.relayPowerOn;

  return (
    <header
      className="px-1 pt-[max(env(safe-area-inset-top),6px)]"
      aria-label="Relay"
    >
      <div className="flex min-h-[44px] min-w-0 items-center justify-between gap-1 py-1 min-[380px]:gap-2 sm:gap-2.5">
        <div className="flex min-w-0 items-center gap-1.5 pl-0.5 min-[380px]:gap-2">
          <button
            type="button"
            aria-pressed={on}
            aria-label={on ? 'Turn Relay off' : 'Turn Relay on'}
            title={on ? 'Turn Relay off' : 'Turn Relay on'}
            onClick={() => {
              haptics('tap');
              dispatch({ type: 'SET_RELAY_POWER_ON', value: !on });
            }}
            className={cn(
              'relay-power-btn inline-flex shrink-0 items-center justify-center rounded-full text-white transition-[background-color,transform,opacity,box-shadow] duration-fast ease-smooth',
              'h-8 w-8 max-[379px]:h-11 max-[379px]:w-11',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
              on
                ? 'bg-[var(--accent)] shadow-sm hover:bg-[var(--accent-strong)] active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100'
                : 'bg-[var(--muted)] hover:opacity-90 active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100',
            )}
          >
            <Flame
              className={cn(
                'h-[1.05rem] w-[1.05rem] min-[380px]:h-4 min-[380px]:w-4',
                !on && 'opacity-70',
              )}
              aria-hidden
            />
          </button>
        </div>
        <div className="flex min-w-0 items-center gap-1 min-[380px]:gap-1.5 overflow-x-auto scrollbar-none">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
