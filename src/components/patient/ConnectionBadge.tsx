import { Cloud, CloudOff, Cpu } from 'lucide-react';
import { StatusBadge } from '@/components/primitives';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useOllamaStatus } from '@/hooks/useOllamaStatus';

export function ConnectionBadge() {
  const online = useOnlineStatus();
  const ollama = useOllamaStatus();

  if (ollama === 'running') {
    return (
      <StatusBadge
        tone="ok"
        dot
        icon={<Cpu className="h-3.5 w-3.5" aria-hidden />}
        className="text-[11px]"
      >
        Gemma local
      </StatusBadge>
    );
  }

  if (ollama === 'unreachable' && online) {
    return (
      <StatusBadge
        tone="warn"
        dot
        icon={<Cpu className="h-3.5 w-3.5" aria-hidden />}
        className="text-[11px]"
      >
        Gemma offline
      </StatusBadge>
    );
  }

  return (
    <StatusBadge
      tone={online ? 'ok' : 'warn'}
      dot
      icon={
        online ? (
          <Cloud className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <CloudOff className="h-3.5 w-3.5" aria-hidden />
        )
      }
      className="text-[11px]"
    >
      {online ? 'Online' : 'Offline'}
    </StatusBadge>
  );
}
