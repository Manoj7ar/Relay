import type { HTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '@/lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'glass-strong' | 'solid';
  padded?: boolean;
}

export function Card({
  variant = 'glass',
  padded = true,
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
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
