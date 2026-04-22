import { HeartPulse, User, Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useHaptics } from '@/hooks/useHaptics';
import type { SetupRole } from '@/types/settings';

interface StepWelcomeProps {
  setupRole: SetupRole;
  onChange: (role: SetupRole) => void;
}

export function StepWelcome({ setupRole, onChange }: StepWelcomeProps) {
  const haptics = useHaptics();

  const choose = (role: SetupRole) => {
    haptics('tap');
    onChange(role);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="glass-strong flex items-center gap-3 rounded-xl2 p-4 shadow-sm">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white">
          <HeartPulse className="h-6 w-6" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-base font-semibold tracking-tight">
            Welcome to Relay
          </p>
          <p className="text-sm leading-snug text-muted">
            A private, local-first voice helper for people with speech
            difficulties.
          </p>
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-1 px-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
          Who's setting this up?
        </legend>

        <RoleCard
          selected={setupRole === 'patient'}
          onClick={() => choose('patient')}
          icon={<User className="h-5 w-5" aria-hidden />}
          title="For me"
          body="I have trouble speaking and I'm setting Relay up for myself."
        />
        <RoleCard
          selected={setupRole === 'caregiver'}
          onClick={() => choose('caregiver')}
          icon={<Users className="h-5 w-5" aria-hidden />}
          title="For someone I care for"
          body="I'm setting up Relay for a loved one, patient, or family member."
        />
      </fieldset>

      <p className="mt-auto text-[11px] leading-snug text-muted">
        Everything you enter stays on this device. You can change any of it
        later in <span className="font-medium text-text">Settings</span>.
      </p>
    </div>
  );
}

interface RoleCardProps {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  body: string;
}

function RoleCard({ selected, onClick, icon, title, body }: RoleCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl2 border p-3 text-start',
        'transition-[background-color,border-color,box-shadow,transform] duration-200 ease-smooth',
        'active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100',
        selected
          ? 'border-[var(--accent)]/60 bg-[var(--accent)]/[0.08] shadow-sm'
          : 'border-black/10 bg-white/60 hover:bg-white/85',
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
          selected
            ? 'bg-[var(--accent)] text-white'
            : 'bg-black/5 text-muted',
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-base font-semibold tracking-tight">
          {title}
        </span>
        <span className="mt-0.5 block text-sm leading-snug text-muted">
          {body}
        </span>
      </span>
    </button>
  );
}
