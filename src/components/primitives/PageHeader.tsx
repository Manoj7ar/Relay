import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface PageHeaderProps
  extends Pick<HTMLAttributes<HTMLElement>, 'className'> {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'shrink-0 pt-[max(env(safe-area-inset-top),6px)]',
        className,
      )}
    >
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      {subtitle ? (
        <p className="mt-0.5 line-clamp-2 text-xs text-muted">{subtitle}</p>
      ) : null}
    </header>
  );
}
