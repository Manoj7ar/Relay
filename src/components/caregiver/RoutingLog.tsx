import { Camera, Cpu, Route } from 'lucide-react';
import { Card, StatusBadge } from '@/components/primitives';
import { useModelRouting } from '@/contexts/ModelRoutingContext';
import { formatClock } from '@/lib/time';

const MAX_ENTRIES = 5;

interface RoutingLogProps {
  compact?: boolean;
}

export function RoutingLog({ compact }: RoutingLogProps) {
  const { routingLog, clearLog } = useModelRouting();
  const entries = compact ? routingLog.slice(0, MAX_ENTRIES) : routingLog;
  const rest = compact ? Math.max(0, routingLog.length - MAX_ENTRIES) : 0;

  if (!routingLog.length) {
    return (
      <Card className="flex flex-col items-center gap-2 py-6 text-center">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/5 text-muted">
          <Route className="h-5 w-5" aria-hidden />
        </span>
        <p className="text-xs font-medium text-text">No routing decisions yet</p>
        <p className="max-w-[280px] text-[11px] leading-snug text-muted">
          Send input from Home (mic, quick phrases, symbols, or type) — each
          interpretation will log its model tier and routing reason here.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-1.5 overflow-hidden">
      <div className="flex shrink-0 items-center justify-between px-1 text-[10px] uppercase tracking-wider text-muted">
        <span>Routing log</span>
        <button
          type="button"
          onClick={clearLog}
          className="rounded-full px-2 py-0.5 text-[11px] hover:bg-black/5"
        >
          Clear
        </button>
      </div>
      <ol className="min-h-0 space-y-1.5 overflow-hidden">
        {entries.map((entry) => (
          <li key={entry.id}>
            <Card padded={false} className={compact ? 'p-2' : 'p-3'}>
              <div className="flex items-center justify-between text-[10px] text-muted">
                <span>{formatClock(entry.ts)}</span>
                <span>{entry.latencyMs} ms</span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1">
                <StatusBadge icon={<Cpu className="h-3 w-3" aria-hidden />}>
                  {entry.model}
                </StatusBadge>
                <StatusBadge className="text-[10px]">
                  {entry.inputType}
                </StatusBadge>
                {entry.visionUsed ? (
                  <StatusBadge
                    icon={<Camera className="h-3 w-3" aria-hidden />}
                    className="text-[10px]"
                  >
                    vision
                  </StatusBadge>
                ) : null}
              </div>
              <p
                className={
                  compact
                    ? 'mt-1 line-clamp-2 text-xs text-text'
                    : 'mt-2 text-sm text-text'
                }
              >
                {entry.reason}
              </p>
            </Card>
          </li>
        ))}
      </ol>
      {rest > 0 ? (
        <p className="shrink-0 text-center text-[10px] text-muted">
          +{rest} older entries
        </p>
      ) : null}
    </div>
  );
}
