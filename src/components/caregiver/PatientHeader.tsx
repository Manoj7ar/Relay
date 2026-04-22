import { useEffect, useState } from 'react';
import { Card } from '@/components/primitives';
import { formatRelative } from '@/lib/time';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSession } from '@/contexts/SessionContext';
import { useSettings } from '@/contexts/SettingsContext';
import { ConfidenceTrend } from './ConfidenceTrend';
import type { InteractionRecord } from '@/types/session';

function useSessionDuration(history: InteractionRecord[]): string {
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const today = history.filter((h) => h.ts >= startOfDay.getTime());
  if (today.length === 0) return 'No interactions today';

  const oldest = today[today.length - 1]?.ts ?? now;
  const diffMs = Math.max(0, now - oldest);
  const hours = Math.floor(diffMs / 3_600_000);
  const mins = Math.floor((diffMs % 3_600_000) / 60_000);
  return hours > 0 ? `${hours}h ${mins}m session` : `${mins}m session`;
}

interface PatientHeaderProps {
  name?: string;
  compact?: boolean;
}

export function PatientHeader({ name, compact }: PatientHeaderProps) {
  const online = useOnlineStatus();
  const { state } = useSession();
  const { settings } = useSettings();
  const last = state.history[0]?.ts;
  const sessionDuration = useSessionDuration(state.history);

  const resolvedName =
    name ??
    (settings.profile.fullName.trim() ||
      settings.profile.displayName.trim() ||
      'Patient');

  return (
    <Card
      variant="glass-strong"
      padded={!compact}
      className={
        compact ? 'flex items-center gap-2.5 p-3' : 'flex items-center gap-4'
      }
    >
      <div
        className={
          compact
            ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-semibold text-white'
            : 'flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-xl font-semibold text-white'
        }
      >
        {resolvedName
          .split(' ')
          .filter(Boolean)
          .map((n) => n[0]?.toUpperCase() ?? '')
          .join('')
          .slice(0, 2) || '•'}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p
            className={
              compact
                ? 'truncate text-sm font-semibold tracking-tight'
                : 'text-lg font-semibold tracking-tight'
            }
          >
            {resolvedName}
          </p>
          <span className="text-[11px] font-medium text-muted">
            {sessionDuration}
          </span>
        </div>
        <p
          className={compact ? 'truncate text-xs text-muted' : 'text-sm text-muted'}
        >
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
        <ConfidenceTrend history={state.history} className="mt-0.5 block" />
      </div>
    </Card>
  );
}
