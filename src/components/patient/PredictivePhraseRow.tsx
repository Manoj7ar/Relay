import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useSession } from '@/contexts/SessionContext';
import { useHaptics } from '@/hooks/useHaptics';
import { usePredictivePhrases } from '@/hooks/usePredictivePhrases';
import { cn } from '@/lib/cn';

const TOP = 3;
const GAP_PX = 10;

function rowWidthNeeded(phrases: string[], count: number): number {
  const slice = phrases.slice(0, count);
  const charPx = 6.4;
  const pad = 28;
  const minBtn = 96;
  const maxBtn = 248;
  let sum = 0;
  for (const p of slice) {
    const w = Math.min(
      maxBtn,
      Math.max(minBtn, Math.min(p.length, 44) * charPx + pad),
    );
    sum += w;
  }
  return sum + GAP_PX * Math.max(0, count - 1);
}

/** How many of `phrases` can sit on one row without exceeding `containerWidth`. */
function maxButtonsInRow(containerWidth: number, phrases: string[]): number {
  const inner = Math.max(0, containerWidth - 8);
  if (inner < 120) return 0;
  for (let n = Math.min(TOP, phrases.length); n >= 1; n--) {
    if (rowWidthNeeded(phrases, n) <= inner) return n;
  }
  return 0;
}

function suggestionButtonClass(inRow: boolean): string {
  return cn(
    'rounded-xl border border-black/10 bg-white/75 px-3 py-2.5 text-center text-sm font-medium leading-snug text-text shadow-sm',
    'transition-[background-color,transform] duration-200 ease-smooth',
    'hover:bg-white/95 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100',
    'min-h-11 text-balance break-words',
    inRow ? 'min-w-0 max-w-[248px] flex-1 basis-0' : 'w-full max-w-sm self-center',
  );
}

export function PredictivePhraseRow() {
  const { settings } = useSettings();
  const { submit } = useSession();
  const { phrases, loading } = usePredictivePhrases();
  const haptics = useHaptics();
  const widthRef = useRef<HTMLDivElement>(null);
  const [rowCount, setRowCount] = useState(1);
  /** If a row layout clips after paint, fall back to stacked full-width buttons. */
  const [forceColumn, setForceColumn] = useState(false);

  const top = useMemo(() => phrases.slice(0, TOP), [phrases]);

  useLayoutEffect(() => {
    const el = widthRef.current;
    if (!el || top.length === 0) {
      setRowCount(1);
      setForceColumn(false);
      return undefined;
    }
    const measure = () => {
      const w = el.getBoundingClientRect().width;
      const n = maxButtonsInRow(w, top);
      setRowCount(n === 0 ? 1 : n);
      setForceColumn(false);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [top]);

  const shown =
    forceColumn || rowCount < 2
      ? top.slice(0, TOP)
      : top.slice(0, rowCount);
  const wantRow =
    !forceColumn && rowCount >= 2 && top.length >= 2;
  const inRow = wantRow;

  const buttonsRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const row = buttonsRef.current;
    if (!row || !wantRow) {
      return undefined;
    }
    const check = () => {
      const clipped =
        row.scrollWidth > row.clientWidth + 2 ||
        row.scrollHeight > row.clientHeight + 2;
      if (clipped) setForceColumn(true);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(row);
    return () => ro.disconnect();
  }, [shown, wantRow, rowCount]);

  if (!settings.relayPowerOn) return null;
  if (top.length === 0 && !loading) return null;

  return (
    <section className="shrink-0 px-0.5" aria-label="Suggestions">
      <div ref={widthRef}>
        <h3 className="mb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted">
          Suggestions
          {loading ? (
            <span className="ms-1 font-normal normal-case text-muted/80">
              · updating…
            </span>
          ) : null}
        </h3>
        <div
          ref={buttonsRef}
          className={cn(
            'mx-auto flex w-full max-w-lg justify-center gap-2.5',
            inRow ? 'flex-nowrap' : 'flex-col items-stretch',
          )}
        >
          {shown.map((phrase) => (
            <button
              key={phrase}
              type="button"
              className={suggestionButtonClass(inRow)}
              title={phrase}
              onClick={() => {
                haptics('tap');
                void submit({
                  inputType: 'text',
                  transcript: phrase,
                  language: settings.language.primaryLanguage,
                  patientLanguage: settings.language.primaryLanguage,
                  caregiverLanguage: settings.language.caregiverLanguage,
                  speakerRole: 'patient',
                });
              }}
            >
              {phrase}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
