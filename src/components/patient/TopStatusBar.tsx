import { Flame } from 'lucide-react';
import { ConnectionBadge } from './ConnectionBadge';
import { LanguageSwitcher } from './LanguageSwitcher';

export function TopStatusBar() {
  return (
    <header
      className="px-1 pt-[max(env(safe-area-inset-top),6px)]"
      aria-label="Relay"
    >
      <div className="glass-strong flex min-h-[44px] items-center justify-between gap-1.5 rounded-full px-2.5 py-2 sm:py-1.5">
        <div className="flex min-w-0 items-center gap-2 pl-1">
          <span
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white"
            aria-hidden
          >
            <Flame className="h-4 w-4" aria-hidden />
          </span>
        </div>
        <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto scrollbar-none">
          <LanguageSwitcher />
          <ConnectionBadge />
        </div>
      </div>
    </header>
  );
}
