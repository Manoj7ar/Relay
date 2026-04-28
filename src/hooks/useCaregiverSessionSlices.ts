import { useMemo } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { detectDistressPattern } from '@/lib/distressDetector';

export function useCaregiverSessionSlices() {
  const { state } = useSession();
  const today = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return state.history.filter((h) => h.ts >= start.getTime());
  }, [state.history]);
  const emergencies = useMemo(
    () => state.history.filter((h) => h.urgency === 'HIGH'),
    [state.history],
  );
  const distressPattern = useMemo(
    () => detectDistressPattern(state.history),
    [state.history],
  );
  return { today, emergencies, distressPattern };
}
