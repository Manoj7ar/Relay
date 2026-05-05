import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  selected?: boolean;
}

export function Chip({
  icon,
  selected,
  className,
  children,
  ...rest
}: ChipProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 py-2 text-sm font-medium',
        'transition-all duration-fast ease-smooth',
        'active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100',
        'relative overflow-hidden',
        selected
          ? 'bg-[var(--accent)] text-white border border-white/10 shadow-glass hover:bg-[var(--accent-strong)] hover:shadow-glass-strong hover-glass-shine'
          : 'glass glass-rich text-text hover:bg-white/75 hover:shadow-glass-strong hover-glass-shine active:glass-press',
        className,
      )}
      aria-pressed={selected}
      {...rest}
    >
      {icon ? <span className="shrink-0">{icon}</span> : null}
      <span className="truncate">{children}</span>
    </button>
  );
}
