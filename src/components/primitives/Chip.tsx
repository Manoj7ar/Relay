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
        'glass transition-[color,background-color,box-shadow,transform] duration-200 ease-smooth',
        'active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100',
        selected
          ? 'bg-[var(--accent)] text-white shadow-sm hover:bg-[var(--accent-strong)] hover:shadow-md'
          : 'hover:bg-white/70 hover:shadow-sm',
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
