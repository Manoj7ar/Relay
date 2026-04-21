import { AlertTriangle, PhoneCall } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { PillButton } from '@/components/primitives';
import { useCountdown } from '@/hooks/useCountdown';
import { useHaptics } from '@/hooks/useHaptics';
import { useSession } from '@/contexts/SessionContext';
import { useSettings } from '@/contexts/SettingsContext';
import { triggerEmergency } from '@/services/emergency';

export function EmergencyBanner() {
  const { state, applyActionTaken } = useSession();
  const { settings } = useSettings();
  const haptics = useHaptics();
  const current = state.currentInterpretation;
  const active = current?.urgency === 'HIGH';
  const [armed, setArmed] = useState(false);
  const firedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!active || !current) {
      setArmed(false);
      return;
    }
    if (firedFor.current !== current.id) {
      firedFor.current = current.id;
      setArmed(true);
      haptics('emergency');
    }
  }, [active, current, haptics]);

  const remaining = useCountdown({
    from: 5,
    active: armed,
    onZero: async () => {
      if (!current) return;
      setArmed(false);
      await triggerEmergency({
        message: current.primary,
        caregiverPhone: settings.integrations.twilio.caregiverPhone,
        ts: Date.now(),
      });
      applyActionTaken(current.id, 'Emergency call triggered');
    },
  });

  if (!active || !armed || !current) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="glass-strong animate-slide-up rounded-xl2 border border-[var(--danger)]/40 bg-[var(--danger)]/[0.08] p-4"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--danger)] text-white">
          <AlertTriangle className="h-5 w-5" aria-hidden />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[var(--danger)]">
            Emergency detected
          </p>
          <p className="text-sm text-text">
            Calling caregiver in <span className="font-bold">{remaining}</span> second
            {remaining === 1 ? '' : 's'}…
          </p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <PillButton
          size="md"
          variant="glass"
          fullWidth
          onClick={() => {
            setArmed(false);
            applyActionTaken(current.id, 'Emergency cancelled', true);
          }}
        >
          Cancel
        </PillButton>
        <PillButton
          size="md"
          variant="danger"
          leftIcon={<PhoneCall className="h-5 w-5" aria-hidden />}
          onClick={async () => {
            setArmed(false);
            await triggerEmergency({
              message: current.primary,
              caregiverPhone: settings.integrations.twilio.caregiverPhone,
              ts: Date.now(),
            });
            applyActionTaken(current.id, 'Emergency call triggered');
          }}
        >
          Call now
        </PillButton>
      </div>
    </div>
  );
}
