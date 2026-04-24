import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { KeyboardEvent } from 'react';
import { cn } from '@/lib/cn';
import { useSession } from '@/contexts/SessionContext';

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
  const { state } = useSession();
  const listRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pill, setPill] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    visible: false,
  });

  const activeIndex = useMemo(
    () => options.findIndex((o) => o.value === value),
    [options, value],
  );

  const measure = useCallback(() => {
    const list = listRef.current;
    if (!list || activeIndex < 0) {
      setPill((s) => ({ ...s, width: 0, visible: false }));
      return;
    }
    const btn = tabRefs.current[activeIndex];
    if (!btn) return;
    const lr = list.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    setPill({
      left: br.left - lr.left,
      top: br.top - lr.top,
      width: br.width,
      height: br.height,
      visible: true,
    });
  }, [activeIndex]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(list);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const rtl = state.direction === 'rtl';
    const forward =
      (e.key === 'ArrowRight' && !rtl) || (e.key === 'ArrowLeft' && rtl);
    const next = forward
      ? Math.min(activeIndex + 1, options.length - 1)
      : Math.max(activeIndex - 1, 0);
    if (next === activeIndex) return;
    onChange(options[next].value);
    requestAnimationFrame(() => tabRefs.current[next]?.focus());
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="glass relative flex gap-1 overflow-x-auto rounded-full p-1 shadow-sm"
    >
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute z-0 rounded-full bg-[var(--accent)]',
          'transition-[left,top,width,height,opacity] duration-300 ease-spring motion-reduce:transition-none',
        )}
        style={{
          left: pill.left,
          top: pill.top,
          width: pill.width,
          height: pill.height,
          opacity: pill.visible && pill.width > 0 ? 1 : 0,
        }}
      />
      {options.map((opt, i) => (
        <button
          key={opt.value}
          ref={(el) => {
            tabRefs.current[i] = el;
          }}
          type="button"
          role="tab"
          aria-selected={opt.value === value}
          tabIndex={opt.value === value ? 0 : -1}
          onClick={() => onChange(opt.value)}
          className={cn(
            'relative z-10 flex min-h-[44px] shrink-0 items-center rounded-full px-4 py-2.5 text-sm font-medium',
            'transition-[color,transform] duration-fast ease-smooth',
            'active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100',
            opt.value === value
              ? 'text-white'
              : 'text-text hover:bg-black/5 motion-reduce:hover:bg-transparent',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
