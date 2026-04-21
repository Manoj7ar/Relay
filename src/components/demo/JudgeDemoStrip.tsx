import { Gavel, Sparkles } from 'lucide-react';
import { PillButton } from '@/components/primitives';
import { useJudgeDemo } from '@/contexts/JudgeDemoContext';
import { cn } from '@/lib/cn';

export function JudgeDemoStrip() {
  const {
    phase,
    activeScenario,
    routingLine,
    stepHint,
    outcomeLine,
    confirmStep,
  } = useJudgeDemo();

  if (phase === 'idle' && !outcomeLine) return null;

  return (
    <div
      className={cn(
        'glass-strong shrink-0 rounded-xl2 border border-black/10 px-3 py-2 text-xs',
        phase === 'confirm' && 'ring-2 ring-[var(--accent)]/30',
      )}
    >
      <div className="mb-1 flex items-center gap-1.5 font-semibold text-text">
        <Gavel className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Judge demo
        {activeScenario ? (
          <span className="truncate font-normal text-muted">
            · {activeScenario.title}
          </span>
        ) : null}
      </div>
      {routingLine ? (
        <p className="mb-1 flex items-start gap-1 text-[11px] text-[var(--accent)]">
          <Sparkles className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
          {routingLine}
        </p>
      ) : null}
      {stepHint ? (
        <p className="text-[11px] leading-snug text-muted">{stepHint}</p>
      ) : null}
      {outcomeLine ? (
        <p className="mt-1.5 rounded-lg bg-white/60 px-2 py-1.5 text-[11px] font-medium text-text">
          {outcomeLine}
        </p>
      ) : null}
      {phase === 'confirm' ? (
        <div className="mt-2">
          <PillButton
            size="md"
            variant="accent"
            fullWidth
            className="!min-h-12 text-base"
            onClick={confirmStep}
          >
            Confirm wording / outcome
          </PillButton>
        </div>
      ) : null}
    </div>
  );
}
