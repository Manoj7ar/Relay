import { Cloud, CloudOff, Cpu } from 'lucide-react';
import { Card } from '@/components/primitives';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function OfflineStatusPanel() {
  const online = useOnlineStatus();
  return (
    <Card className="space-y-2">
      <p className="text-sm font-semibold">Connectivity</p>
      <div className="flex items-center gap-3 rounded-xl2 bg-white/70 p-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-white">
          {online ? (
            <Cloud className="h-5 w-5" aria-hidden />
          ) : (
            <CloudOff className="h-5 w-5" aria-hidden />
          )}
        </span>
        <div>
          <p className="text-base font-medium">
            {online ? 'Online' : 'Offline'}
          </p>
          <p className="inline-flex items-center gap-1.5 text-sm text-muted">
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
