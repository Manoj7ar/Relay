import { Flame } from 'lucide-react';
import { ConnectionBadge } from './ConnectionBadge';
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
      <div className="flex min-h-[44px] items-center justify-between gap-2 py-1 sm:gap-2.5">
        <div className="flex min-w-0 items-center gap-2 pl-0.5">
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
              'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-[background-color,transform,opacity,box-shadow] duration-fast ease-smooth',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
              on
                ? 'bg-[var(--accent)] shadow-sm hover:bg-[var(--accent-strong)] active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100'
                : 'bg-[var(--muted)] hover:opacity-90 active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100',
            )}
          >
            <Flame
              className={cn('h-4 w-4', !on && 'opacity-70')}
              aria-hidden
            />
          </button>
        </div>
        <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto scrollbar-none">
          <LanguageSwitcher />
          <ConnectionBadge />
        </div>
      </div>
    </header>
  );
}
