import { Outlet } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { PatientHeader } from '@/components/caregiver/PatientHeader';
import { useCaregiverSessionSlices } from '@/hooks/useCaregiverSessionSlices';

export function CaregiverLayout() {
  const { distressPattern } = useCaregiverSessionSlices();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden pt-2">
      <div className="shrink-0">
        <PatientHeader compact />
      </div>

      {distressPattern ? (
        <div
          role="alert"
          className="flex shrink-0 items-start gap-2 rounded-xl2 border border-[var(--danger)]/40 bg-[var(--danger)]/[0.06] px-3 py-2 text-sm font-medium text-[var(--danger)]"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>Repeated distress signals detected in the last 5 minutes.</span>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
