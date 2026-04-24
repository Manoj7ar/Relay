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
  glass: 'glass shadow-sm hover:bg-white/70 hover:shadow-md',
  solid:
    'bg-[var(--accent)] text-white shadow-sm hover:bg-[var(--accent-strong)] hover:shadow-md',
  ghost: 'bg-transparent shadow-none hover:bg-black/5 hover:shadow-sm',
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
          'transition-[color,background-color,box-shadow,transform,filter] duration-fast ease-smooth',
          'active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100',
          'disabled:pointer-events-none disabled:opacity-40 disabled:active:scale-100',
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
