import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, MessagesSquare } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { useHaptics } from '@/hooks/useHaptics';
import { resolveLanguageDisplay } from '@/lib/relayLanguages';
import { cn } from '@/lib/cn';
import { BilingualConversationStrip } from '@/components/patient/BilingualConversationStrip';

interface MenuPosition {
  top: number;
  left: number;
  width: number;
}

const MENU_MAX_WIDTH = 360;

function computeMenuPosition(trigger: HTMLElement): MenuPosition {
  const rect = trigger.getBoundingClientRect();
  const vv = window.visualViewport;
  const vw = vv?.width ?? window.innerWidth;
  const vh = vv?.height ?? window.innerHeight;
  const width = Math.min(MENU_MAX_WIDTH, vw - 16);
  const triggerCenterX = rect.left + rect.width / 2;
  let left = triggerCenterX - width / 2;
  left = Math.max(8, Math.min(left, vw - width - 8));
  const margin = 8;
  const estimatedMenuHeight = Math.min(520, vh * 0.82);
  let top = rect.bottom + margin;
  if (top + estimatedMenuHeight > vh - margin) {
    top = Math.max(margin, vh - estimatedMenuHeight - margin);
  }
  if (top < margin) {
    top = margin;
  }
  return { top, left, width };
}

/** Header control: opens conversation / bilingual settings (replaces single-language picker). */
export function LanguageSwitcher() {
  const panelId = useId();
  const titleId = `${panelId}-title`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPosition | null>(null);
  const { settings } = useSettings();
  const haptics = useHaptics();

  const primary = resolveLanguageDisplay(settings.language.primaryLanguage);
  const partner = resolveLanguageDisplay(settings.language.caregiverLanguage);
  const summaryLine = `${primary.short} ↔ ${partner.short}`;

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
      if (rootRef.current?.contains(t) || menuRef.current?.contains(t)) {
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

  const menu =
    open && menuPos ? (
      <div
        ref={menuRef}
        id={panelId}
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        style={{
          position: 'fixed',
          top: menuPos.top,
          left: menuPos.left,
          width: menuPos.width,
          zIndex: 200,
        }}
        className="glass-strong max-h-[min(32rem,min(82dvh,520px))] max-w-[calc(100vw-1rem)] overflow-y-auto rounded-xl2 border border-black/10 px-2 py-2 shadow-lg max-[379px]:px-2.5 max-[379px]:py-2.5"
      >
        <BilingualConversationStrip embedded titleId={titleId} />
      </div>
    ) : null;

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        id={`${panelId}-trigger`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={`Open conversation settings: ${summaryLine}`}
        onClick={() => {
          haptics('tap');
          setOpen((v) => !v);
        }}
        className={cn(
          'inline-flex max-w-[min(13rem,54vw)] items-center gap-1 rounded-full border font-medium',
          'min-h-11 gap-1.5 px-2.5 py-2 text-[clamp(10px,2.9vw,11px)]',
          'min-[380px]:max-w-[min(12rem,44vw)] min-[380px]:min-h-9 min-[380px]:gap-1 min-[380px]:px-2.5 min-[380px]:py-1.5',
          'backdrop-blur-md transition-[background-color,box-shadow,transform] duration-200 ease-smooth',
          'border-white/80 bg-white/60 text-text hover:bg-white/85 hover:shadow-sm',
          'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
          'active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100',
          open && 'bg-white/90 shadow-sm ring-1 ring-[var(--accent)]/25',
        )}
      >
        <MessagesSquare className="h-4 w-4 shrink-0 opacity-70 min-[380px]:h-3.5 min-[380px]:w-3.5" aria-hidden />
        <span aria-hidden className="shrink-0 text-[10px]">
          {primary.flag}
        </span>
        <span aria-hidden className="shrink-0 text-muted">
          ↔
        </span>
        <span aria-hidden className="shrink-0 text-[10px]">
          {partner.flag}
        </span>
        <span className="min-w-0 truncate vp-narrow-sr-only">{summaryLine}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 opacity-60 transition-transform duration-200 min-[380px]:h-3.5 min-[380px]:w-3.5',
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
