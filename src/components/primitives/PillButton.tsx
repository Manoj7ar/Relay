import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'accent' | 'glass' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg' | 'xl';

export interface PillButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const sizeMap: Record<Size, string> = {
  sm: 'min-h-[44px] px-5 text-sm',
  md: 'min-h-[56px] px-6 text-base',
  lg: 'min-h-[68px] px-7 text-lg',
  xl: 'min-h-[var(--touch)] px-8 text-xl',
};

const variantMap: Record<Variant, string> = {
  accent:
    'bg-[var(--accent)] text-white border border-black/10 shadow-glass hover:bg-[var(--accent-strong)]',
  glass:
    'glass text-text hover:bg-white/70 transition-colors',
  danger:
    'bg-[var(--danger)] text-white border border-black/10 shadow-glass hover:brightness-110',
  ghost: 'bg-transparent text-text hover:bg-black/5',
};

export const PillButton = forwardRef<HTMLButtonElement, PillButtonProps>(
  function PillButton(
    {
      variant = 'accent',
      size = 'xl',
      leftIcon,
      rightIcon,
      fullWidth,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-3 rounded-full font-semibold',
          'transition-transform active:scale-[0.98] select-none',
          sizeMap[size],
          variantMap[variant],
          fullWidth && 'w-full',
          className,
        )}
        {...rest}
      >
        {leftIcon ? <span className="shrink-0">{leftIcon}</span> : null}
        <span className="truncate">{children}</span>
        {rightIcon ? <span className="shrink-0">{rightIcon}</span> : null}
      </button>
    );
  },
);
