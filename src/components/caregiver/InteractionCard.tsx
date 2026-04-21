import { Camera, Cpu, MessageSquareText } from 'lucide-react';
import { Card, StatusBadge } from '@/components/primitives';
import { formatClock } from '@/lib/time';
import type { InteractionRecord } from '@/types/session';
import type { Urgency } from '@/types/model';

const URGENCY_TONE: Record<Urgency, 'ok' | 'warn' | 'danger'> = {
  LOW: 'ok',
  NORMAL: 'warn',
  HIGH: 'danger',
};

export function InteractionCard({
  record,
  compact,
}: {
  record: InteractionRecord;
  compact?: boolean;
}) {
  return (
    <Card padded={!compact} className={compact ? 'p-3' : undefined}>
      <div
        className={
          compact
            ? 'mb-1 flex items-center justify-between text-[10px] text-muted'
            : 'mb-2 flex items-center justify-between text-xs text-muted'
        }
      >
        <span>{formatClock(record.ts)}</span>
        <span className="inline-flex items-center gap-1.5">
          <Cpu className="h-3.5 w-3.5" aria-hidden /> {record.model}
          {record.visionUsed ? (
            <>
              <span className="mx-1">·</span>
              <Camera className="h-3.5 w-3.5" aria-hidden />
              vision
            </>
          ) : null}
        </span>
      </div>
      {record.sourceFragment ? (
        <p className="mb-1 flex items-center gap-1.5 text-xs text-muted">
          <MessageSquareText className="h-3 w-3" aria-hidden />
          <span className="italic truncate">"{record.sourceFragment}"</span>
        </p>
      ) : null}
      <p
        className={
          compact
            ? 'line-clamp-2 text-sm font-medium'
            : 'text-base font-medium'
        }
      >
        {record.primary}
      </p>
      <div
        className={
          compact
            ? 'mt-1.5 flex flex-wrap items-center gap-1'
            : 'mt-3 flex flex-wrap items-center gap-1.5'
        }
      >
        <StatusBadge
          tone={URGENCY_TONE[record.urgency]}
          dot
          className={compact ? 'text-[10px]' : 'text-[11px]'}
        >
          {record.urgency}
        </StatusBadge>
        <StatusBadge className={compact ? 'text-[10px]' : 'text-[11px]'}>
          {record.mood}
        </StatusBadge>
        <StatusBadge
          tone={record.cancelled ? 'warn' : 'neutral'}
          className={compact ? 'text-[10px]' : 'text-[11px]'}
        >
          {record.actionTaken ?? 'Spoken only'}
        </StatusBadge>
      </div>
    </Card>
  );
}
