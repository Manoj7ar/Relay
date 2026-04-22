import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { IconButton, PillButton } from '@/components/primitives';
import { cn } from '@/lib/cn';
import { useHaptics } from '@/hooks/useHaptics';

interface OnboardingShellProps {
  title: string;
  description?: string;
  stepIndex: number;
  stepCount: number;
  onBack?: () => void;
  onContinue: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  isFinalStep?: boolean;
  skipLabel?: string;
  onSkip?: () => void;
  children: ReactNode;
}

export function OnboardingShell({
  title,
  description,
  stepIndex,
  stepCount,
  onBack,
  onContinue,
  continueLabel,
  continueDisabled,
  isFinalStep,
  skipLabel,
  onSkip,
  children,
}: OnboardingShellProps) {
  const haptics = useHaptics();

  return (
    <div className="relative mx-auto flex h-full min-h-0 w-full max-w-mobile flex-col overflow-hidden safe-x">
      <div
        className="shrink-0 pt-[max(env(safe-area-inset-top),16px)]"
        aria-hidden={false}
      >
        <ProgressDots count={stepCount} current={stepIndex} />
      </div>

      <main
        className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-3 pt-4"
        aria-live="polite"
      >
        <header className="mb-4 shrink-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Step {stepIndex + 1} of {stepCount}
          </p>
          <h1 className="mt-1 text-2xl font-semibold leading-tight tracking-tight">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 text-sm leading-snug text-muted">
              {description}
            </p>
          ) : null}
        </header>

        <div className="min-h-0 flex-1 animate-slide-up">{children}</div>
      </main>

      <footer
        className={cn(
          'shrink-0',
          'pt-2 pb-[max(env(safe-area-inset-bottom),14px)]',
        )}
      >
        {onSkip && skipLabel ? (
          <div className="mb-2 flex justify-center">
            <button
              type="button"
              onClick={() => {
                haptics('tap');
                onSkip();
              }}
              className="rounded-full px-4 py-2 text-xs font-medium text-muted transition-[background-color,transform] duration-200 ease-smooth hover:bg-black/5 hover:text-text active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
            >
              {skipLabel}
            </button>
          </div>
        ) : null}
        <div
          className={cn(
            'flex w-full items-center',
            onBack ? 'gap-2' : 'justify-center',
          )}
        >
          {onBack ? (
            <IconButton
              type="button"
              variant="glass"
              size="md"
              label="Back"
              icon={<ArrowLeft className="h-5 w-5" aria-hidden />}
              onClick={() => {
                haptics('tap');
                onBack();
              }}
              className="shrink-0"
            />
          ) : null}
          <PillButton
            variant="accent"
            size="md"
            fullWidth={!onBack}
            disabled={continueDisabled}
            onClick={() => {
              haptics('tap');
              onContinue();
            }}
            rightIcon={
              isFinalStep ? (
                <Check className="h-4 w-4" aria-hidden />
              ) : (
                <ArrowRight className="h-4 w-4" aria-hidden />
              )
            }
            className={onBack ? 'min-w-0 flex-1' : undefined}
          >
            {continueLabel ?? (isFinalStep ? 'Finish' : 'Continue')}
          </PillButton>
        </div>
      </footer>
    </div>
  );
}

interface ProgressDotsProps {
  count: number;
  current: number;
}

function ProgressDots({ count, current }: ProgressDotsProps) {
  return (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={count}
      aria-valuenow={current + 1}
      className="mx-auto flex w-full max-w-[18rem] items-center gap-1.5"
    >
      {Array.from({ length: count }).map((_, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <span
            key={i}
            aria-hidden
            className={cn(
              'h-1.5 flex-1 rounded-full transition-[background-color,transform] duration-300 ease-smooth',
              done
                ? 'bg-[var(--accent)]'
                : active
                  ? 'bg-[var(--accent)]/70 scale-y-[1.4]'
                  : 'bg-black/10',
            )}
          />
        );
      })}
    </div>
  );
}
