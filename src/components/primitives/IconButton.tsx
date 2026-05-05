import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'glass' | 'solid' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  variant?: Variant;
  size?: Size;
  label: string;
}

const sizeMap: Record<Size, string> = {
  sm: 'h-11 w-11 min-h-[44px] min-w-[44px]',
  md: 'h-12 w-12',
  lg: 'h-14 w-14',
};

const variantMap: Record<Variant, string> = {
  glass: 'glass glass-rich shadow-glass hover:bg-white/75 hover:shadow-glass-strong hover-glass-shine active:glass-press',
  solid:
    'bg-[var(--accent)] text-white shadow-glass hover:bg-[var(--accent-strong)] hover:shadow-glass-strong hover-glass-shine',
  ghost: 'glass-subtle shadow-none hover:bg-white/40 hover:shadow-glass active:glass-press',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { icon, label, variant = 'glass', size = 'md', className, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        aria-label={label}
        title={label}
        className={cn(
          'inline-flex items-center justify-center rounded-full',
          'transition-all duration-fast ease-smooth',
          'active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100',
          'disabled:pointer-events-none disabled:opacity-40 disabled:active:scale-100',
          'relative overflow-hidden',
          sizeMap[size],
          variantMap[variant],
          className,
        )}
        {...rest}
      >
        {icon}
      </button>
    );
  },
);
