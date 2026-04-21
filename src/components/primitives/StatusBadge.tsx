import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'ok' | 'warn' | 'danger' | 'info';

interface StatusBadgeProps {
  tone?: Tone;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
  dot?: boolean;
}

const toneMap: Record<Tone, string> = {
  neutral: 'bg-white/60 text-text border-white/80',
  ok: 'bg-white/60 text-text border-white/80',
  warn: 'bg-white/70 text-[#7a5a00] border-white/80',
  danger: 'bg-white/70 text-[var(--danger)] border-white/80',
  info: 'bg-white/70 text-[#1d3a5a] border-white/80',
};

const dotMap: Record<Tone, string> = {
  neutral: 'bg-[var(--muted)]',
  ok: 'bg-emerald-500',
  warn: 'bg-amber-500',
  danger: 'bg-[var(--danger)]',
  info: 'bg-sky-500',
};

export function StatusBadge({
  tone = 'neutral',
  icon,
  className,
  children,
  dot,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
        'backdrop-blur-md border',
        toneMap[tone],
        className,
      )}
    >
      {dot ? (
        <span
          className={cn('inline-block h-2 w-2 rounded-full', dotMap[tone])}
        />
      ) : null}
      {icon ? <span className="shrink-0">{icon}</span> : null}
      <span className="truncate">{children}</span>
    </span>
  );
}
