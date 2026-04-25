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
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const firedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!active || !current) {
      setArmed(false);
      return;
    }
    if (firedFor.current !== current.id) {
      firedFor.current = current.id;
      setArmed(true);
      setStatusMsg(null);
      haptics('emergency');
    }
  }, [active, current, haptics]);

  const dispatchEmergency = async () => {
    if (!current) return;
    try {
      await triggerEmergency({
        message: current.primary,
        caregiverPhone: settings.integrations.caregiverPhone,
        ts: Date.now(),
      });
      applyActionTaken(current.id, 'Emergency call triggered');
      setStatusMsg(null);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Emergency dispatch failed.';
      applyActionTaken(current.id, msg);
      setStatusMsg(msg);
    }
  };

  const remaining = useCountdown({
    from: 5,
    active: armed,
    onZero: async () => {
      setArmed(false);
      await dispatchEmergency();
    },
  });

  if (!active || !current) return null;
  if (!armed && !statusMsg) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="glass-strong animate-slide-up fixed left-1/2 z-40 w-[min(calc(100vw-1.5rem),calc(430px-1.5rem))] max-w-mobile -translate-x-1/2 rounded-xl2 border border-[var(--danger)]/40 bg-[var(--danger)]/[0.08] p-3 shadow-glass-lg"
      style={{
        bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--danger)] text-white">
          <AlertTriangle className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[var(--danger)]">
            Emergency detected
          </p>
          {armed ? (
            <p className="text-xs text-text">
              Calling in <span className="font-bold">{remaining}</span>s…
            </p>
          ) : null}
          {statusMsg ? (
            <p className="mt-0.5 text-[11px] leading-snug text-text">
              {statusMsg}
            </p>
          ) : null}
        </div>
      </div>
      {armed ? (
        <div className="mt-2 flex gap-2">
          <PillButton
            size="sm"
            variant="glass"
            fullWidth
            className="!min-h-11 text-sm"
            onClick={() => {
              setArmed(false);
              applyActionTaken(current.id, 'Emergency cancelled', true);
            }}
          >
            Cancel
          </PillButton>
          <PillButton
            size="sm"
            variant="danger"
            className="!min-h-11 text-sm"
            leftIcon={<PhoneCall className="h-4 w-4" aria-hidden />}
            onClick={async () => {
              setArmed(false);
              await dispatchEmergency();
            }}
          >
            Call now
          </PillButton>
        </div>
      ) : (
        <div className="mt-2">
          <PillButton
            size="sm"
            variant="glass"
            fullWidth
            className="!min-h-10 text-xs"
            onClick={() => setStatusMsg(null)}
          >
            Dismiss
          </PillButton>
        </div>
      )}
    </div>
  );
}
