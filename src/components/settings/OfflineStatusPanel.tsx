import { Cloud, CloudOff, Cpu } from 'lucide-react';
import { Card } from '@/components/primitives';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { SettingsControlCard } from '@/components/settings/SettingsShell';

export function OfflineStatusPanel({ embedded }: { embedded?: boolean }) {
  const online = useOnlineStatus();

  const body = (
    <div className="flex items-center gap-3">
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white">
        {online ? (
          <Cloud className="h-5 w-5" aria-hidden />
        ) : (
          <CloudOff className="h-5 w-5" aria-hidden />
        )}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold">
          {online ? 'Online' : 'Offline'}
        </p>
        <p className="inline-flex items-center gap-1 text-xs text-muted">
          <Cpu className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {online
            ? 'Internet available; remote Ollama possible if configured.'
            : 'No internet; local or LAN Ollama still works when reachable.'}
        </p>
      </div>
    </div>
  );

  if (embedded) {
    return <SettingsControlCard>{body}</SettingsControlCard>;
  }

  return (
    <Card padded={false} className="min-h-0 space-y-2 p-3">
      <p className="text-xs font-semibold">Connectivity</p>
      {body}
    </Card>
  );
}
