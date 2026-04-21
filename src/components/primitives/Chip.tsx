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
        'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium',
        'glass transition-colors',
        selected
          ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]'
          : 'hover:bg-white/70',
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
