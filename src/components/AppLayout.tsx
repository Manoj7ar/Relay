import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Activity, Home, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { RelayPausedBanner } from '@/components/patient/RelayPausedBanner';
import { useSession } from '@/contexts/SessionContext';
import { useViewportShell } from '@/hooks/useViewportShell';
import type { PropsWithChildren } from 'react';

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
}

const NAV: NavItem[] = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/caregiver', label: 'Caregiver', icon: Activity },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export function AppLayout({ children }: PropsWithChildren) {
  const { state } = useSession();
  useViewportShell();
  return (
    <div
      dir={state.direction}
      className="relative mx-auto flex h-full min-h-0 w-full max-w-mobile flex-col overflow-hidden safe-x"
    >
      <main
        className={cn(
          'flex min-h-0 flex-1 flex-col overflow-hidden',
          'main-scroll-pad',
        )}
      >
        <RelayPausedBanner />
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

function BottomNav() {
  const location = useLocation();
  const listRef = useRef<HTMLUListElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [pill, setPill] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    visible: false,
  });

  const activeIndex = useMemo(() => {
    const p = location.pathname;
    return NAV.findIndex((n) => {
      if (n.to === '/') return p === '/';
      if (n.to === '/settings')
        return p === '/settings' || p.startsWith('/settings/');
      if (n.to === '/caregiver')
        return p === '/caregiver' || p.startsWith('/caregiver/');
      return p === n.to;
    });
  }, [location.pathname]);

  const measure = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    if (activeIndex < 0) {
      setPill((s) => ({ ...s, width: 0, visible: false }));
      return;
    }
    const link = linkRefs.current[activeIndex];
    if (!link) return;
    const lr = list.getBoundingClientRect();
    const ar = link.getBoundingClientRect();
    setPill({
      left: ar.left - lr.left,
      top: ar.top - lr.top,
      width: ar.width,
      height: ar.height,
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

  return (
    <nav
      aria-label="Primary"
      className={cn(
        'fixed bottom-0 left-1/2 z-30 w-full max-w-mobile -translate-x-1/2',
        'px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-2',
      )}
    >
      <ul
        ref={listRef}
        className="bottom-nav-dock relative mx-auto flex items-stretch justify-between gap-0.5 rounded-full p-1 sm:gap-1 sm:p-1.5"
      >
        <div
          aria-hidden
          className={cn(
            'bottom-nav-active-pill pointer-events-none absolute z-0 rounded-full bg-[var(--accent)]',
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
        {NAV.map((item, i) => {
          const Icon = item.icon;
          return (
            <li key={item.to} className="flex min-w-0 flex-1">
              <NavLink
                ref={(el) => {
                  linkRefs.current[i] = el;
                }}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'bottom-nav-link relative z-10 flex w-full min-h-[48px] flex-col items-center justify-center gap-1 rounded-full px-1 py-2 text-[clamp(10px,2.6vw,11px)] font-medium leading-none ease-smooth active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 sm:px-2',
                    isActive ? 'text-white' : 'text-text',
                  )
                }
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                <span className="max-w-full truncate vp-narrow-sr-only">
                  {item.label}
                </span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
