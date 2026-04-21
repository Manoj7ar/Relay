import { Camera, Cpu } from 'lucide-react';
import { Card, StatusBadge } from '@/components/primitives';
import { useModelRouting } from '@/contexts/ModelRoutingContext';
import { formatClock } from '@/lib/time';

export function RoutingLog() {
  const { routingLog, clearLog } = useModelRouting();

  if (!routingLog.length) {
    return (
      <Card className="text-center text-sm text-muted">
        No routing decisions recorded yet.
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1 text-[11px] uppercase tracking-wider text-muted">
        <span>Routing log</span>
        <button
          onClick={clearLog}
          className="rounded-full px-2 py-0.5 hover:bg-black/5"
        >
          Clear
        </button>
      </div>
      <ol className="space-y-2">
        {routingLog.map((entry) => (
          <li key={entry.id}>
            <Card padded={false} className="p-3">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{formatClock(entry.ts)}</span>
                <span>{entry.latencyMs} ms</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge icon={<Cpu className="h-3.5 w-3.5" aria-hidden />}>
                  {entry.model}
                </StatusBadge>
                <StatusBadge className="text-[11px]">
                  {entry.inputType}
                </StatusBadge>
                {entry.visionUsed ? (
                  <StatusBadge
                    icon={<Camera className="h-3.5 w-3.5" aria-hidden />}
                    className="text-[11px]"
                  >
                    vision
                  </StatusBadge>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-text">{entry.reason}</p>
            </Card>
          </li>
        ))}
      </ol>
    </div>
  );
}
