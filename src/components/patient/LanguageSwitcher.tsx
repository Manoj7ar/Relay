import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Languages } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { useSettings } from '@/contexts/SettingsContext';
import { directionFor } from '@/hooks/useRTL';
import { useHaptics } from '@/hooks/useHaptics';
import {
  PRIMARY_LANGUAGE_OPTIONS,
  resolveLanguageDisplay,
} from '@/lib/relayLanguages';
import { cn } from '@/lib/cn';

interface MenuPosition {
  top: number;
  left: number;
  width: number;
}

const MENU_MAX_WIDTH = 288;

function computeMenuPosition(trigger: HTMLElement): MenuPosition {
  const rect = trigger.getBoundingClientRect();
  const vw = window.innerWidth;
  const width = Math.min(MENU_MAX_WIDTH, vw - 16);
  let left = rect.right - width;
  left = Math.max(8, Math.min(left, vw - width - 8));
  const top = rect.bottom + 8;
  return { top, left, width };
}

export function LanguageSwitcher() {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPosition | null>(null);
  const { dispatch: sessionDispatch } = useSession();
  const { settings, dispatch: settingsDispatch } = useSettings();
  const haptics = useHaptics();

  const code = settings.language.primaryLanguage;
  const { flag, short } = resolveLanguageDisplay(code);
  const primaryLine =
    PRIMARY_LANGUAGE_OPTIONS.find((o) => o.code === code)?.label ?? short;

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null);
      return;
    }
    const update = () => {
      const t = triggerRef.current;
      if (!t) return;
      setMenuPos(computeMenuPosition(t));
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    const vv = window.visualViewport;
    vv?.addEventListener('scroll', update);
    vv?.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
      vv?.removeEventListener('scroll', update);
      vv?.removeEventListener('resize', update);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        rootRef.current?.contains(t) ||
        menuRef.current?.contains(t)
      ) {
        return;
      }
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (next: string) => {
    haptics('tap');
    settingsDispatch({ type: 'SET_PRIMARY_LANGUAGE', value: next });
    sessionDispatch({
      type: 'SET_LANGUAGE',
      language: next,
      direction: directionFor(next),
    });
    setOpen(false);
  };

  const menu =
    open && menuPos ? (
      <div
        ref={menuRef}
        id={listId}
        role="listbox"
        aria-labelledby={`${listId}-trigger`}
        style={{
          position: 'fixed',
          top: menuPos.top,
          left: menuPos.left,
          width: menuPos.width,
          zIndex: 200,
        }}
        className="glass-strong max-h-[min(20rem,55dvh)] overflow-y-auto rounded-xl2 border border-black/10 py-1 shadow-lg"
      >
        <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
          Speaking language
        </p>
        <p className="px-3 pb-2 text-[10px] leading-snug text-muted">
          Used for mic, typing, and Gemma. Also updates layout for RTL
          languages.
        </p>
        <ul className="border-t border-black/5 pt-1">
          {PRIMARY_LANGUAGE_OPTIONS.map((opt) => {
            const selected = opt.code === code;
            const d = resolveLanguageDisplay(opt.code);
            return (
              <li key={opt.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => pick(opt.code)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2.5 text-start text-sm transition-colors',
                    'hover:bg-black/[0.04] active:bg-black/[0.07]',
                    selected &&
                      'bg-[var(--accent)]/[0.12] font-medium text-text',
                  )}
                >
                  <span aria-hidden className="shrink-0 text-base">
                    {d.flag}
                  </span>
                  <span className="min-w-0 flex-1 leading-snug">{opt.label}</span>
                  {selected ? (
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">
                      Active
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    ) : null;

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        id={`${listId}-trigger`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => {
          haptics('tap');
          setOpen((v) => !v);
        }}
        className={cn(
          'inline-flex max-w-[min(11rem,42vw)] items-center gap-1 rounded-full border px-2.5 py-1.5 text-[11px] font-medium',
          'backdrop-blur-md transition-[background-color,box-shadow,transform] duration-200 ease-smooth',
          'border-white/80 bg-white/60 text-text hover:bg-white/85 hover:shadow-sm',
          'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
          'active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100',
          open && 'bg-white/90 shadow-sm ring-1 ring-[var(--accent)]/25',
        )}
      >
        <Languages className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
        <span aria-hidden className="shrink-0">
          {flag}
        </span>
        <span className="min-w-0 truncate">{primaryLine}</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 opacity-60 transition-transform duration-200',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {typeof document !== 'undefined' && menu
        ? createPortal(menu, document.body)
        : null}
    </div>
  );
}
