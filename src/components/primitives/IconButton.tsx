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
  sm: 'h-10 w-10',
  md: 'h-12 w-12',
  lg: 'h-14 w-14',
};

const variantMap: Record<Variant, string> = {
  glass: 'glass hover:bg-white/70',
  solid: 'bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]',
  ghost: 'bg-transparent hover:bg-black/5',
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
          'inline-flex items-center justify-center rounded-full transition-transform active:scale-95',
          'disabled:pointer-events-none disabled:opacity-40',
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
