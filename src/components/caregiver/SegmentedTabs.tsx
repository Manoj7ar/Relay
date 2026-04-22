import { cn } from '@/lib/cn';

interface SegmentedTabsProps<T extends string> {
  value: T;
  onChange: (next: T) => void;
  options: { value: T; label: string }[];
  label: string;
}

export function SegmentedTabs<T extends string>({
  value,
  onChange,
  options,
  label,
}: SegmentedTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="glass flex gap-1 overflow-x-auto rounded-full p-1 shadow-sm"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          role="tab"
          aria-selected={opt.value === value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex min-h-[44px] shrink-0 items-center rounded-full px-4 py-2.5 text-sm font-medium',
            'transition-[color,background-color,box-shadow,transform] duration-200 ease-smooth',
            'active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100',
            opt.value === value
              ? 'bg-[var(--accent)] text-white shadow-sm'
              : 'text-text hover:bg-black/5 hover:shadow-sm',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
