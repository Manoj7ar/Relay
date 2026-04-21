import { Card } from '@/components/primitives';
import { formatRelative } from '@/lib/time';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSession } from '@/contexts/SessionContext';

interface PatientHeaderProps {
  name?: string;
  compact?: boolean;
}

export function PatientHeader({
  name = 'Maya Singh',
  compact,
}: PatientHeaderProps) {
  const online = useOnlineStatus();
  const { state } = useSession();
  const last = state.history[0]?.ts;

  return (
    <Card
      variant="glass-strong"
      padded={!compact}
      className={compact ? 'flex items-center gap-2.5 p-3' : 'flex items-center gap-4'}
    >
      <div
        className={
          compact
            ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-semibold text-white'
            : 'flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-xl font-semibold text-white'
        }
      >
        {name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={
            compact
              ? 'truncate text-sm font-semibold tracking-tight'
              : 'text-lg font-semibold tracking-tight'
          }
        >
          {name}
        </p>
        <p className={compact ? 'truncate text-xs text-muted' : 'text-sm text-muted'}>
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
