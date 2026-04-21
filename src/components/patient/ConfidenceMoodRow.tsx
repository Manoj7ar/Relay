import { Gauge, HeartPulse } from 'lucide-react';
import { StatusBadge } from '@/components/primitives';
import type { Mood, Urgency } from '@/types/model';
import { cn } from '@/lib/cn';

interface ConfidenceMoodRowProps {
  confidence: number;
  urgency: Urgency;
  mood: Mood;
  className?: string;
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
}: ConfidenceMoodRowProps) {
  const pct = Math.round(confidence * 100);
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      <StatusBadge
        icon={<Gauge className="h-3.5 w-3.5" aria-hidden />}
        className="text-[11px]"
      >
        {pct}% confidence
      </StatusBadge>
      <StatusBadge
        tone={URGENCY_TONE[urgency]}
        dot
        className="text-[11px]"
      >
        {urgency}
      </StatusBadge>
      <StatusBadge
        icon={<HeartPulse className="h-3.5 w-3.5" aria-hidden />}
        className="text-[11px]"
      >
        {MOOD_LABEL[mood]}
      </StatusBadge>
    </div>
  );
}
