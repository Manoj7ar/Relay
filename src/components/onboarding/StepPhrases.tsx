import { Plus, Trash2 } from 'lucide-react';
import type { ChangeEvent } from 'react';
import type { SetupRole } from '@/types/settings';

interface StepPhrasesProps {
  setupRole: SetupRole;
  phrases: string[];
  onChange: (phrases: string[]) => void;
}

const MAX_PHRASES = 5;
const MAX_LEN = 80;

const SUGGESTIONS: string[] = [
  'Play some jazz, please.',
  'Call Priya.',
  'Turn up the lights.',
  "I'd like to watch the news.",
];

export function StepPhrases({ setupRole, phrases, onChange }: StepPhrasesProps) {
  const isSelf = setupRole === 'patient';

  const update = (index: number, value: string) => {
    const next = [...phrases];
    next[index] = value.slice(0, MAX_LEN);
    onChange(next);
  };

  const add = (seed = '') => {
    if (phrases.length >= MAX_PHRASES) return;
    onChange([...phrases, seed]);
  };

  const remove = (index: number) => {
    onChange(phrases.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        {isSelf
          ? 'Add up to 5 shortcuts you reach for often. They appear at the top of the Quick phrase picker.'
          : 'Add up to 5 things they say most days. These become quick shortcuts on the home screen.'}
      </p>

      {phrases.length === 0 ? (
        <div className="rounded-xl2 border border-dashed border-black/15 bg-white/50 p-3 text-center text-xs text-muted">
          No personal phrases yet. Skip this step or try a suggestion below.
        </div>
      ) : (
        <ul className="space-y-2">
          {phrases.map((phrase, i) => (
            <li key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={phrase}
                maxLength={MAX_LEN}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  update(i, e.target.value)
                }
                placeholder={`Shortcut ${i + 1}`}
                className="control-input text-sm"
                aria-label={`Shortcut ${i + 1}`}
              />
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove shortcut ${i + 1}`}
                className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full border border-black/10 bg-white/70 text-muted transition-[background-color,transform] duration-200 ease-smooth hover:bg-white hover:text-text active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {phrases.length < MAX_PHRASES ? (
        <button
          type="button"
          onClick={() => add('')}
          className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-full border border-dashed border-[var(--accent)]/50 bg-[var(--accent)]/[0.05] px-3 py-2 text-sm font-semibold text-[var(--accent)] transition-[background-color,transform] duration-200 ease-smooth hover:bg-[var(--accent)]/10 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add shortcut ({phrases.length}/{MAX_PHRASES})
        </button>
      ) : null}

      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
          Suggestions
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.filter(
            (s) => !phrases.some((p) => p.trim() === s),
          ).map((s) => (
            <button
              key={s}
              type="button"
              disabled={phrases.length >= MAX_PHRASES}
              onClick={() => add(s)}
              className="min-h-[36px] rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-medium text-muted transition-[background-color,transform] duration-200 ease-smooth hover:bg-white hover:text-text active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100"
            >
              + {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
