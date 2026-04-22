import { NavLink } from 'react-router-dom';
import { Activity, Home, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
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
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className={cn(
        'fixed bottom-0 left-1/2 z-30 w-full max-w-mobile -translate-x-1/2',
        'px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-2',
      )}
    >
      <ul className="glass-strong mx-auto flex items-stretch justify-between gap-0.5 rounded-full p-1 sm:gap-1 sm:p-1.5">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to} className="flex min-w-0 flex-1">
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex w-full min-h-[48px] flex-col items-center justify-center gap-1 rounded-full px-1 py-2 text-[clamp(10px,2.6vw,11px)] font-medium leading-none transition-transform active:scale-[0.98] sm:px-2',
                    isActive
                      ? 'bg-[var(--accent)] text-white'
                      : 'text-text hover:bg-black/5',
                  )
                }
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                <span className="max-w-full truncate">{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
