import { Card } from '@/components/primitives';
import { useSettings } from '@/contexts/SettingsContext';
import type { InterpreterModeSetting } from '@/types/settings';
import { cn } from '@/lib/cn';

interface Option {
  id: InterpreterModeSetting;
  label: string;
  hint: string;
  disabled?: boolean;
}

const OPTIONS: Option[] = [
  {
    id: 'browser',
    label: 'Browser fallback',
    hint: 'Normalizes transcript; no AI.',
  },
  {
    id: 'mock',
    label: 'Mock / demo router',
    hint: 'Rule-based Gemma-tier routing (E2B / E4B / 27B).',
  },
  {
    id: 'gemma',
    label: 'Gemma 4 (local)',
    hint: 'Not wired yet — placeholder adapter.',
    disabled: true,
  },
];

/**
 * Developer/demo-only selector to swap the interpretation adapter. Lives
 * next to the demo toggle + inside Settings > Developer.
 *
 * Wired by `SessionContext.submit` via `settings.devMode.interpreter`.
 */
export function InterpreterModePicker() {
  const { settings, dispatch } = useSettings();
  const current = settings.devMode.interpreter;

  return (
    <Card padded={false} className="p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        Interpreter
      </p>
      <p className="mb-2 mt-0.5 text-[11px] text-muted">
        Which adapter handles `transcript → phrase`. Swap `gemma` when Ollama is live.
      </p>
      <div role="radiogroup" className="grid gap-1.5">
        {OPTIONS.map((opt) => {
          const checked = current === opt.id;
          return (
            <button
              key={opt.id}
              role="radio"
              aria-checked={checked}
              disabled={opt.disabled}
              onClick={() =>
                dispatch({ type: 'SET_INTERPRETER_MODE', value: opt.id })
              }
              className={cn(
                'flex items-start gap-2 rounded-xl2 border border-transparent px-3 py-2 text-left transition',
                checked
                  ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                  : 'bg-white/70 hover:bg-white',
                opt.disabled && 'opacity-55',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'mt-1 inline-block h-3 w-3 shrink-0 rounded-full border',
                  checked
                    ? 'border-[var(--accent)] bg-[var(--accent)]'
                    : 'border-muted',
                )}
              />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-semibold text-text">
                  {opt.label}
                </span>
                <span className="text-[11px] text-muted">{opt.hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
