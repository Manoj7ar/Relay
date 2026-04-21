import { Cloud, CloudOff } from 'lucide-react';
import { StatusBadge } from '@/components/primitives';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function ConnectionBadge() {
  const online = useOnlineStatus();
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
      {online ? 'Online' : 'Offline · Gemma local'}
    </StatusBadge>
  );
}
