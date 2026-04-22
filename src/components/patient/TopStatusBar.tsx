import { Flame } from 'lucide-react';
import { ConnectionBadge } from './ConnectionBadge';
import { LanguageBadge } from './LanguageBadge';
import { useSession } from '@/contexts/SessionContext';
import { useSettings } from '@/contexts/SettingsContext';
import { hourOfDay } from '@/lib/time';

function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Hi';
  if (hour >= 17 && hour < 22) return 'Good evening';
  return 'Hi';
}

export function TopStatusBar() {
  const { state } = useSession();
  const { settings } = useSettings();

  const name = settings.profile.displayName.trim();
  const hi = name ? `${greetingFor(hourOfDay())}, ${name}` : 'Relay';

  return (
    <header className="px-1 pt-[max(env(safe-area-inset-top),6px)]">
      <div className="glass-strong flex min-h-[44px] items-center justify-between gap-1.5 rounded-full px-2.5 py-2 sm:py-1.5">
        <div className="flex min-w-0 items-center gap-2 pl-1">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white">
            <Flame className="h-4 w-4" aria-hidden />
          </span>
          <span className="min-w-0 truncate font-semibold tracking-tight">
            {hi}
          </span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <LanguageBadge language={state.detectedLanguage} />
          <ConnectionBadge />
        </div>
      </div>
    </header>
  );
}
