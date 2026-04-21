import { Gauge, HeartPulse } from 'lucide-react';
import { StatusBadge } from '@/components/primitives';
import type { Mood, Urgency } from '@/types/model';
import { cn } from '@/lib/cn';

interface ConfidenceMoodRowProps {
  confidence: number;
  urgency: Urgency;
  mood: Mood;
  className?: string;
  /** Tighter badges for single-screen mobile layout */
  compact?: boolean;
}

const URGENCY_TONE: Record<Urgency, 'ok' | 'warn' | 'danger'> = {
  LOW: 'ok',
  NORMAL: 'warn',
  HIGH: 'danger',
};

const MOOD_LABEL: Record<Mood, string> = {
  calm: 'Calm',
  distressed: 'Distressed',
  frustrated: 'Frustrated',
  'in-pain': 'In pain',
};

export function ConfidenceMoodRow({
  confidence,
  urgency,
  mood,
  className,
  compact,
}: ConfidenceMoodRowProps) {
  const pct = Math.round(confidence * 100);
  const sz = compact ? 'h-3 w-3' : 'h-3.5 w-3.5';
  const text = compact ? 'text-[10px] px-2 py-1' : 'text-[11px]';
  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      <StatusBadge
        icon={<Gauge className={sz} aria-hidden />}
        className={text}
      >
        {pct}%
      </StatusBadge>
      <StatusBadge tone={URGENCY_TONE[urgency]} dot className={text}>
        {urgency}
      </StatusBadge>
      <StatusBadge
        icon={<HeartPulse className={sz} aria-hidden />}
        className={text}
      >
        {MOOD_LABEL[mood]}
      </StatusBadge>
    </div>
  );
}
