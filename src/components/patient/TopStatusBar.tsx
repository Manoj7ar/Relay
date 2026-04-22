import { Flame } from 'lucide-react';
import { ConnectionBadge } from './ConnectionBadge';
import { LanguageBadge } from './LanguageBadge';
import { useSession } from '@/contexts/SessionContext';

export function TopStatusBar() {
  const { state } = useSession();

  return (
    <header className="px-1 pt-[max(env(safe-area-inset-top),6px)]">
      <div className="glass-strong flex min-h-[44px] items-center justify-between gap-1.5 rounded-full px-2.5 py-2 sm:py-1.5">
        <div className="flex items-center gap-2 pl-1">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-white">
            <Flame className="h-4 w-4" aria-hidden />
          </span>
          <span className="font-semibold tracking-tight">Relay</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <LanguageBadge language={state.detectedLanguage} />
          <ConnectionBadge />
        </div>
      </div>
    </header>
  );
}
