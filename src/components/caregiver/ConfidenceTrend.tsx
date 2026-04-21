import { cn } from '@/lib/cn';
import type { InteractionRecord } from '@/types/session';

interface ConfidenceTrendProps {
  history: InteractionRecord[];
  className?: string;
}

export function ConfidenceTrend({ history, className }: ConfidenceTrendProps) {
  const recent = history.slice(0, 3);
  if (recent.length < 2) return null;

  const avg =
    recent.reduce((sum, r) => sum + r.confidence, 0) / recent.length;
  const first = recent[0]!.confidence;
  const last = recent[recent.length - 1]!.confidence;
  const trend = first - last;

  const label =
    trend > 0.05 ? '↑ Improving' : trend < -0.05 ? '↓ Declining' : '→ Stable';
  const tone =
    trend > 0.05
      ? 'text-emerald-600'
      : trend < -0.05
        ? 'text-[var(--danger)]'
        : 'text-muted';

  return (
    <span className={cn('text-xs font-medium', tone, className)}>
      {label} · avg {Math.round(avg * 100)}%
    </span>
  );
}
