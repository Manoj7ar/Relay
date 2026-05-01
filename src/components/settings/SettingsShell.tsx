import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PropsWithChildren, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Full-height settings column with horizontal padding aligned to main app content. */
export function SettingsScreen({
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

export function SettingsSubpageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="shrink-0 border-b border-black/[0.06] pb-3 pt-[max(env(safe-area-inset-top),6px)]">
      <Link
        to="/settings"
        aria-label="Back to settings"
        className={cn(
          'inline-flex min-h-[44px] min-w-0 items-center gap-1 rounded-lg px-2 py-2 text-sm font-medium text-[var(--accent)]',
          'transition-[color,background-color] duration-fast ease-smooth',
          'hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
          'min-[380px]:min-h-0 min-[380px]:px-0 min-[380px]:py-1',
        )}
      >
        <ChevronLeft className="h-5 w-5 shrink-0 min-[380px]:h-4 min-[380px]:w-4" aria-hidden />
        <span className="vp-narrow-sr-only">Back to settings</span>
      </Link>
      <h1 className="mt-3 text-[clamp(1.125rem,4.2vw,1.25rem)] font-bold tracking-tight text-text">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-1 text-xs leading-relaxed text-muted">{subtitle}</p>
      ) : null}
    </header>
  );
}

export function SettingsHubSection({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  return (
    <section className="space-y-2">
      <h2 className="px-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
        {title}
      </h2>
      <div className="flex flex-col gap-1.5">{children}</div>
    </section>
  );
}

export function SettingsNavRow({
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
        'glass flex min-h-[52px] items-center gap-3 rounded-xl2 px-3 py-2.5 shadow-sm',
        'transition-[transform,background-color,box-shadow] duration-fast ease-smooth',
        'hover:bg-white/80 hover:shadow-md',
        'active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
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

export function SettingsSection({
  title,
  description,
  children,
  className,
}: PropsWithChildren<{
  title?: string;
  description?: string;
  className?: string;
}>) {
  return (
    <section className={cn('space-y-2', className)}>
      {title ? (
        <h2 className="text-sm font-semibold text-text">{title}</h2>
      ) : null}
      {description ? (
        <p className="text-xs leading-relaxed text-muted">{description}</p>
      ) : null}
      {children}
    </section>
  );
}

export function SettingsStack({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return <div className={cn('flex flex-col gap-3', className)}>{children}</div>;
}

export function SettingsControlCard({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        'rounded-xl2 border border-black/10 bg-white/70 p-3 shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  );
}
