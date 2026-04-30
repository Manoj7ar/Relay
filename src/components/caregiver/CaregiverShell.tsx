import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PropsWithChildren, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function CaregiverScreen({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col overflow-hidden px-2 min-[380px]:px-2.5',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CaregiverSubpageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="shrink-0 border-b border-black/[0.06] pb-3 pt-0.5">
      <Link
        to="/caregiver"
        className={cn(
          'inline-flex items-center gap-1 rounded-lg py-1 text-sm font-medium text-[var(--accent)]',
          'transition-[color,background-color] duration-fast ease-smooth',
          'hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
        )}
      >
        <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
        Back to caregiver
      </Link>
      <h1 className="mt-3 text-xl font-bold tracking-tight text-text">{title}</h1>
      {subtitle ? (
        <p className="mt-1 text-xs leading-relaxed text-muted">{subtitle}</p>
      ) : null}
    </header>
  );
}

export function CaregiverHubSection({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  return (
    <section className="space-y-1.5">
      <h2 className="px-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
        {title}
      </h2>
      <div className="flex flex-col gap-1">{children}</div>
    </section>
  );
}

export function CaregiverNavRow({
  to,
  icon,
  title,
  description,
}: {
  to: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        'glass flex min-h-[48px] items-center gap-2.5 rounded-xl2 px-3 py-2 shadow-sm',
        'transition-[transform,background-color,box-shadow] duration-fast ease-smooth',
        'hover:bg-white/80 hover:shadow-md',
        'active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-text">{title}</span>
        <span className="mt-0.5 block text-xs leading-snug text-muted">
          {description}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted" aria-hidden />
    </Link>
  );
}
