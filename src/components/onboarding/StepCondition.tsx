import type { ChangeEvent } from 'react';
import { useId } from 'react';
import { cn } from '@/lib/cn';
import type { ConditionId, SetupRole } from '@/types/settings';

interface StepConditionProps {
  setupRole: SetupRole;
  condition: ConditionId;
  detail: string;
  onCondition: (value: ConditionId) => void;
  onDetail: (value: string) => void;
}

const OPTIONS: Array<{ id: ConditionId; label: string; hint: string }> = [
  { id: 'als', label: 'ALS / MND', hint: 'Progressive weakening of speech' },
  { id: 'aphasia', label: 'Aphasia', hint: 'Word-finding after stroke / TBI' },
  {
    id: 'dysarthria',
    label: 'Dysarthria',
    hint: 'Slurred or low-volume speech',
  },
  { id: 'parkinson', label: "Parkinson's", hint: 'Soft, unsteady voice' },
  { id: 'other', label: 'Something else', hint: 'Describe below' },
];

export function StepCondition({
  setupRole,
  condition,
  detail,
  onCondition,
  onDetail,
}: StepConditionProps) {
  const detailId = useId();
  const isSelf = setupRole === 'patient';
  const pronoun = isSelf ? 'your' : 'their';

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        This helps Relay tailor transcripts and pick better model prompts.{' '}
        <span className="font-medium text-text">Totally optional.</span>
      </p>

      <div
        role="radiogroup"
        aria-label={`Primary speech condition (${pronoun})`}
        className="flex flex-wrap gap-1.5"
      >
        {OPTIONS.map((opt) => {
          const selected = condition === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onCondition(selected ? '' : opt.id)}
              className={cn(
                'min-h-[44px] rounded-full px-3.5 py-2 text-sm font-medium transition-[background-color,border-color,box-shadow,transform] duration-200 ease-smooth',
                'border active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100',
                selected
                  ? 'border-[var(--accent)]/60 bg-[var(--accent)]/[0.1] text-text shadow-sm'
                  : 'border-black/10 bg-white/70 text-muted hover:bg-white',
              )}
              title={opt.hint}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <label htmlFor={detailId} className="block">
        <span className="mb-1.5 block text-sm font-medium leading-snug">
          Anything we should know?
        </span>
        <span className="mb-2 block text-[12px] leading-snug text-muted">
          {isSelf
            ? 'Rhythm of the day, volume, AAC or gestures — anything that helps Relay read you fairly.'
            : 'Daily patterns, devices, or cues that help Relay understand them better.'}
        </span>
        <textarea
          id={detailId}
          value={detail}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
            onDetail(e.target.value)
          }
          rows={4}
          autoComplete="off"
          spellCheck
          placeholder={
            isSelf
              ? 'Example: My voice is quiet before noon · I spell on a tablet when I\'m tired · afternoons are harder than mornings.'
              : 'Example: Quiet voice before lunch · spells on a tablet when fatigued · more alert mid-morning.'
          }
          maxLength={280}
          className={cn(
            'control-textarea',
            'min-h-[clamp(7rem,26dvh,10rem)] text-[15px] leading-relaxed',
            'shadow-sm ring-1 ring-black/[0.04]',
          )}
        />
        <span className="mt-2 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-[11px] leading-snug text-muted">
          <span className="min-w-0 flex-1">
            Private to this device — never sent to a server.
          </span>
          <span className="tabular-nums text-text/70">{detail.length}/280</span>
        </span>
      </label>
    </div>
  );
}
