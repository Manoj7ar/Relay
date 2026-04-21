import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '@/components/primitives';
import { formatClock } from '@/lib/time';
import type { InteractionRecord } from '@/types/session';

interface EmergencyTimelineProps {
  events: InteractionRecord[];
}

export function EmergencyTimeline({ events }: EmergencyTimelineProps) {
  if (!events.length) {
    return (
      <Card className="text-center text-sm text-muted">
        No emergencies recorded. 
      </Card>
    );
  }
  return (
    <ol className="relative space-y-3 pl-6">
      <span
        aria-hidden
        className="absolute left-2 top-1 bottom-1 w-px bg-black/10"
      />
      {events.map((e) => {
        const cancelled = Boolean(e.cancelled);
        return (
          <li key={e.id} className="relative">
            <span
              aria-hidden
              className="absolute -left-[22px] top-5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--danger)] text-white shadow"
            >
              <AlertTriangle className="h-3 w-3" />
            </span>
            <Card padded={false} className="p-3">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{formatClock(e.ts)}</span>
                <span className="inline-flex items-center gap-1.5">
                  {cancelled ? (
                    <>
                      <XCircle className="h-3.5 w-3.5 text-amber-600" />{' '}
                      Cancelled
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />{' '}
                      Completed
                    </>
                  )}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium">{e.primary}</p>
              <p className="mt-1 text-xs text-muted">{e.actionTaken}</p>
            </Card>
          </li>
        );
      })}
    </ol>
  );
}
