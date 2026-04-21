import { Cloud, CloudOff, Cpu } from 'lucide-react';
import { Card } from '@/components/primitives';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function OfflineStatusPanel() {
  const online = useOnlineStatus();
  return (
    <Card padded={false} className="h-full min-h-0 space-y-2 overflow-hidden p-3">
      <p className="text-xs font-semibold">Connectivity</p>
      <div className="flex items-center gap-2 rounded-xl2 bg-white/70 p-2">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white">
          {online ? (
            <Cloud className="h-5 w-5" aria-hidden />
          ) : (
            <CloudOff className="h-5 w-5" aria-hidden />
          )}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {online ? 'Online' : 'Offline'}
          </p>
          <p className="inline-flex items-center gap-1 text-xs text-muted">
            <Cpu className="h-3.5 w-3.5" aria-hidden />
            {online
              ? 'Cloud models available.'
              : 'Gemma 4 running locally.'}
          </p>
        </div>
      </div>
    </Card>
  );
}
