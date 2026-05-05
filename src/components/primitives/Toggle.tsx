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
        'flex min-h-[48px] items-center justify-between gap-3 cursor-pointer select-none sm:gap-4',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <span className="min-w-0 flex-1 pe-2">
        <span className="block text-base font-medium text-text">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-sm text-muted">{description}</span>
        ) : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          onChange(!checked);
        }}
        className={cn(
          'relative isolate h-11 w-14 shrink-0 rounded-full p-0.5',
          'glass-toggle transition-all duration-300 ease-smooth',
          'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
          'enabled:active:scale-[0.96] motion-reduce:transition-none motion-reduce:enabled:active:scale-100',
          checked
            ? 'glass-toggle-active'
            : 'glass-toggle-inactive',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute top-1/2 size-8 -translate-y-1/2 rounded-full',
            'glass-toggle-thumb transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.34,1.35,0.64,1)]',
            'motion-reduce:transition-none motion-reduce:duration-0',
            'start-0.5',
            checked
              ? 'translate-x-[1.25rem] rtl:-translate-x-[1.25rem]'
              : 'translate-x-0',
            checked && 'glass-toggle-thumb-active',
          )}
        />
      </button>
    </label>
  );
}
