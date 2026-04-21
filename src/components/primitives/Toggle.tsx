import { cn } from '@/lib/cn';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: ToggleProps) {
  return (
    <label
      className={cn(
        'flex items-center justify-between gap-4 cursor-pointer select-none',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <span className="flex-1">
        <span className="block text-base font-medium text-text">{label}</span>
        {description ? (
          <span className="block text-sm text-muted mt-0.5">{description}</span>
        ) : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-8 w-14 shrink-0 rounded-full transition-colors',
          'border border-black/10',
          checked ? 'bg-[var(--accent)]' : 'bg-white/80',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-7 w-7 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-6' : 'translate-x-0.5',
          )}
        />
      </button>
    </label>
  );
}
