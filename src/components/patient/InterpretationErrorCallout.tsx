import { AlertCircle } from 'lucide-react';
import type { SessionInterpretationError } from '@/types/interpretationError';
import { cn } from '@/lib/cn';

export function InterpretationErrorCallout({
  error,
  onDismiss,
}: {
  error: SessionInterpretationError;
  onDismiss: () => void;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-xl2 border border-[var(--danger)]/35 bg-[var(--danger)]/[0.07]',
        'p-3 shadow-sm',
      )}
    >
      <div className="flex items-start gap-2.5">
        <AlertCircle
          className="mt-0.5 h-4 w-4 shrink-0 text-[var(--danger)]"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-text">
            {error.title}
          </p>
          {error.hint ? (
            <p className="mt-1 text-xs leading-relaxed text-muted">{error.hint}</p>
          ) : null}
          {error.technical ? (
            <details className="mt-2 rounded-lg border border-black/[0.08] bg-black/[0.03] px-2 py-1.5">
              <summary className="cursor-pointer select-none text-[10px] font-semibold uppercase tracking-wider text-muted">
                Technical details
              </summary>
              <pre className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap break-words font-mono text-[10px] leading-relaxed text-muted">
                {error.technical}
              </pre>
            </details>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-full bg-black/5 px-3 py-1.5 text-[10px] font-semibold transition-[background-color,transform] duration-200 ease-smooth hover:bg-black/10 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
