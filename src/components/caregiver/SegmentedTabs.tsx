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
      className="glass flex gap-1 rounded-full p-1 overflow-x-auto"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          role="tab"
          aria-selected={opt.value === value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors',
            opt.value === value
              ? 'bg-[var(--accent)] text-white'
              : 'text-text hover:bg-black/5',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
