import type { ChangeEvent } from 'react';
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

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">
          Anything we should know?
        </span>
        <textarea
          value={detail}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
            onDetail(e.target.value)
          }
          rows={3}
          placeholder={
            isSelf
              ? 'e.g. I speak softly in the mornings; I use an iPad to point.'
              : 'e.g. She speaks softly in the mornings; points to an iPad.'
          }
          maxLength={280}
          className="control-textarea text-sm"
        />
        <span className="mt-1 flex justify-between text-[11px] text-muted">
          <span>This stays on this device.</span>
          <span>{detail.length}/280</span>
        </span>
      </label>
    </div>
  );
}
