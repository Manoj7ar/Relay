import { useLocation } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { cn } from '@/lib/cn';

/**
 * Short fade when switching main tabs; remounts children so route-level
 * animations run once per navigation.
 */
export function RoutedViews({ children }: PropsWithChildren) {
  const { pathname } = useLocation();
  return (
    <div
      key={pathname}
      className={cn(
        'flex min-h-0 flex-1 flex-col',
        'motion-safe:animate-route-fade motion-reduce:animate-none',
      )}
    >
      {children}
    </div>
  );
}
