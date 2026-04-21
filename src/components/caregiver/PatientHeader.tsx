import { Card } from '@/components/primitives';
import { formatRelative } from '@/lib/time';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSession } from '@/contexts/SessionContext';

interface PatientHeaderProps {
  name?: string;
}

export function PatientHeader({ name = 'Maya Singh' }: PatientHeaderProps) {
  const online = useOnlineStatus();
  const { state } = useSession();
  const last = state.history[0]?.ts;

  return (
    <Card variant="glass-strong" className="flex items-center gap-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-xl font-semibold text-white">
        {name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)}
      </div>
      <div className="flex-1">
        <p className="text-lg font-semibold tracking-tight">{name}</p>
        <p className="text-sm text-muted">
          <span
            className={
              online
                ? 'text-emerald-600 font-medium'
                : 'text-amber-600 font-medium'
            }
          >
            ● {online ? 'Online' : 'Offline'}
          </span>
          {last ? ` · last interaction ${formatRelative(last)}` : ''}
        </p>
      </div>
    </Card>
  );
}
