import { Flame } from 'lucide-react';
import { ModelChip } from './ModelChip';
import { ConnectionBadge } from './ConnectionBadge';
import { LanguageBadge } from './LanguageBadge';
import { useModelRouting } from '@/contexts/ModelRoutingContext';
import { useSession } from '@/contexts/SessionContext';

export function TopStatusBar() {
  const { currentModel } = useModelRouting();
  const { state } = useSession();

  return (
    <header className="px-1 pt-[max(env(safe-area-inset-top),6px)]">
      <div className="glass-strong flex items-center justify-between gap-1.5 rounded-full px-2.5 py-1.5">
        <div className="flex items-center gap-2 pl-1">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-white">
            <Flame className="h-4 w-4" aria-hidden />
          </span>
          <span className="font-semibold tracking-tight">Relay</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <LanguageBadge language={state.detectedLanguage} />
          <ModelChip modelId={currentModel} />
          <ConnectionBadge />
        </div>
      </div>
    </header>
  );
}
