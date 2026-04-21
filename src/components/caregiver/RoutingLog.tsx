import { useMemo, useState } from 'react';
import { Camera, Cpu, Route } from 'lucide-react';
import { Card, StatusBadge } from '@/components/primitives';
import { useModelRouting } from '@/contexts/ModelRoutingContext';
import { formatClock } from '@/lib/time';
import { cn } from '@/lib/cn';
import type { ModelId } from '@/types/model';

const MAX_ENTRIES = 5;

type ModelFilter = 'all' | ModelId;

const FILTERS: { value: ModelFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'E2B', label: 'E2B' },
  { value: 'E4B', label: 'E4B' },
  { value: '27B', label: '27B' },
];

interface RoutingLogProps {
  compact?: boolean;
}

export function RoutingLog({ compact }: RoutingLogProps) {
  const { routingLog, clearLog } = useModelRouting();
  const [filter, setFilter] = useState<ModelFilter>('all');

  const filtered = useMemo(
    () =>
      filter === 'all'
        ? routingLog
        : routingLog.filter((e) => e.model === filter),
    [routingLog, filter],
  );
  const entries = compact ? filtered.slice(0, MAX_ENTRIES) : filtered;
  const rest = compact ? Math.max(0, filtered.length - MAX_ENTRIES) : 0;

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

      <div className="flex shrink-0 flex-wrap gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={cn(
              'rounded-full px-3 py-1 text-[11px] font-medium transition',
              filter === f.value
                ? 'bg-[var(--accent)] text-white'
                : 'glass text-text hover:bg-black/5',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {entries.length === 0 ? (
        <p className="shrink-0 px-1 text-[11px] text-muted">
          No entries for {filter} in the log yet.
        </p>
      ) : (
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
      )}
      {rest > 0 ? (
        <p className="shrink-0 text-center text-[10px] text-muted">
          +{rest} older entries
        </p>
      ) : null}
    </div>
  );
}
