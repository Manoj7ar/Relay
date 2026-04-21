import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '@/components/primitives';
import { formatClock } from '@/lib/time';
import type { InteractionRecord } from '@/types/session';

interface EmergencyTimelineProps {
  events: InteractionRecord[];
  compact?: boolean;
}

const MAX_EVENTS = 4;

export function EmergencyTimeline({
  events,
  compact,
}: EmergencyTimelineProps) {
  const shown = compact ? events.slice(0, MAX_EVENTS) : events;
  const rest = compact ? Math.max(0, events.length - MAX_EVENTS) : 0;

  if (!events.length) {
    return (
      <Card className="flex flex-col items-center gap-2 py-6 text-center">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--danger)]/10 text-[var(--danger)]">
          <AlertTriangle className="h-5 w-5" aria-hidden />
        </span>
        <p className="text-xs font-medium text-text">No emergency events yet</p>
        <p className="max-w-[260px] text-[11px] leading-snug text-muted">
          HIGH-urgency interpretations (or cancelled countdowns) show on this timeline.
        </p>
      </Card>
    );
  }
  return (
    <ol className="relative space-y-2 pl-5">
      <span
        aria-hidden
        className="absolute left-2 top-1 bottom-1 w-px bg-black/10"
      />
      {shown.map((e) => {
        const cancelled = Boolean(e.cancelled);
        return (
          <li key={e.id} className="relative">
            <span
              aria-hidden
              className="absolute -left-[18px] top-3 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--danger)] text-white shadow"
            >
              <AlertTriangle className="h-2.5 w-2.5" />
            </span>
            <Card padded={false} className={compact ? 'p-2' : 'p-3'}>
              <div className="flex items-center justify-between text-[10px] text-muted">
                <span>{formatClock(e.ts)}</span>
                <span className="inline-flex items-center gap-1">
                  {cancelled ? (
                    <>
                      <XCircle className="h-3 w-3 text-amber-600" /> Cancelled
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />{' '}
                      Done
                    </>
                  )}
                </span>
              </div>
              <p
                className={
                  compact
                    ? 'mt-0.5 line-clamp-2 text-xs font-medium'
                    : 'mt-1 text-sm font-medium'
                }
              >
                {e.primary}
              </p>
              <p className="mt-0.5 line-clamp-1 text-[10px] text-muted">
                {e.actionTaken}
              </p>
            </Card>
          </li>
        );
      })}
      {rest > 0 ? (
        <li className="pl-1 text-center text-[10px] text-muted">
          +{rest} more
        </li>
      ) : null}
    </ol>
  );
}
