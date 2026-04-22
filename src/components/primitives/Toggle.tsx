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
          'border border-black/10 shadow-inner transition-[background-color,box-shadow,border-color] duration-300 ease-out',
          'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
          'enabled:active:scale-[0.96] motion-reduce:transition-none motion-reduce:enabled:active:scale-100',
          checked
            ? 'border-black/15 bg-[var(--accent)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.12)]'
            : 'bg-black/[0.06] shadow-[inset_0_1px_3px_rgba(0,0,0,0.08)]',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute top-1/2 size-8 -translate-y-1/2 rounded-full bg-white',
            'shadow-[0_1px_3px_rgba(0,0,0,0.18),0_1px_1px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.06]',
            'transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.34,1.35,0.64,1)]',
            'motion-reduce:transition-none motion-reduce:duration-0',
            'start-0.5',
            checked
              ? 'translate-x-[1.25rem] rtl:-translate-x-[1.25rem]'
              : 'translate-x-0',
            checked &&
              'shadow-[0_2px_6px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.35)_inset]',
          )}
        />
      </button>
    </label>
  );
}
