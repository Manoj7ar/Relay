import type { HTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '@/lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'glass-strong' | 'solid';
  padded?: boolean;
  /** Subtle lift on hover for tappable cards (skips motion when reduced). */
  interactive?: boolean;
}

export function Card({
  variant = 'glass',
  padded = true,
  interactive = false,
  className,
  children,
  ...rest
}: PropsWithChildren<CardProps>) {
  const variantClass =
    variant === 'solid'
      ? 'bg-[var(--surface)] border border-black/5'
      : variant === 'glass-strong'
        ? 'glass-strong'
        : 'glass';
  return (
    <div
      className={cn(
        'rounded-xl2 text-text',
        variantClass,
        padded && 'p-5',
        interactive &&
          'cursor-pointer transition-[transform,box-shadow] duration-fast ease-out will-change-transform hover:-translate-y-0.5 hover:shadow-elevate-lg active:translate-y-0 active:shadow-elevate motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-none',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
