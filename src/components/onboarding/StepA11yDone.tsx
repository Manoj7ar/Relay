import { CheckCircle2, Contrast, Type } from 'lucide-react';
import { Toggle } from '@/components/primitives';
import { useSettings } from '@/contexts/SettingsContext';
import type { ProfileSettings, SetupRole } from '@/types/settings';

interface StepA11yDoneProps {
  setupRole: SetupRole;
  profile: ProfileSettings;
}

export function StepA11yDone({ setupRole, profile }: StepA11yDoneProps) {
  const { settings, dispatch } = useSettings();

  const name =
    profile.displayName.trim() ||
    profile.fullName.trim() ||
    (setupRole === 'patient' ? 'you' : 'them');
  const isSelf = setupRole === 'patient';

  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Reading comfort
        </h2>
        <div className="glass rounded-xl2 p-3 shadow-sm">
          <div className="flex items-start gap-3">
            <Contrast className="mt-1 h-4 w-4 shrink-0 text-muted" aria-hidden />
            <div className="min-w-0 flex-1">
              <Toggle
                checked={settings.accessibility.highContrast}
                onChange={(v) =>
                  dispatch({ type: 'SET_HIGH_CONTRAST', value: v })
                }
                label="High-contrast mode"
                description="Darker text and stronger borders for bright rooms."
              />
            </div>
          </div>
          <div className="mt-1 flex items-start gap-3">
            <Type className="mt-1 h-4 w-4 shrink-0 text-muted" aria-hidden />
            <div className="min-w-0 flex-1">
              <Toggle
                checked={settings.accessibility.largeText}
                onChange={(v) =>
                  dispatch({ type: 'SET_LARGE_TEXT', value: v })
                }
                label="Larger text"
                description="Bumps every label up ~18%."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          You're all set
        </h2>
        <div className="rounded-xl2 border border-[var(--accent)]/30 bg-[var(--accent)]/[0.06] p-3 shadow-sm">
          <div className="flex items-start gap-2">
            <CheckCircle2
              className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]"
              aria-hidden
            />
            <div className="text-sm leading-snug">
              <p className="font-semibold">
                {isSelf ? `Welcome, ${name}.` : `Relay is ready for ${name}.`}
              </p>
              <p className="mt-0.5 text-muted">
                Tap <span className="font-medium text-text">Start Relay</span>{' '}
                to open the home screen. You can re-record voice samples or
                edit anything from <span className="font-medium text-text">Settings → Profile</span>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
