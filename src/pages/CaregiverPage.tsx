import { useMemo, useState } from 'react';
import { PatientHeader } from '@/components/caregiver/PatientHeader';
import { SegmentedTabs } from '@/components/caregiver/SegmentedTabs';
import { InteractionCard } from '@/components/caregiver/InteractionCard';
import { RoutingLog } from '@/components/caregiver/RoutingLog';
import { EmergencyTimeline } from '@/components/caregiver/EmergencyTimeline';
import { HandoverNote } from '@/components/caregiver/HandoverNote';
import { Card } from '@/components/primitives';
import { useSession } from '@/contexts/SessionContext';

type Tab = 'today' | 'routing' | 'emergencies' | 'handover';

export function CaregiverPage() {
  const [tab, setTab] = useState<Tab>('today');
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

  return (
    <div className="flex flex-col gap-4 px-4 pt-2">
      <header className="safe-top">
        <h1 className="text-xl font-semibold tracking-tight">Caregiver</h1>
        <p className="text-sm text-muted">
          Oversight and coordination for today's interactions.
        </p>
      </header>
      <PatientHeader />

      <SegmentedTabs
        label="Caregiver sections"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'today', label: 'Today' },
          { value: 'routing', label: 'Routing log' },
          { value: 'emergencies', label: 'Emergencies' },
          { value: 'handover', label: 'Handover' },
        ]}
      />

      {tab === 'today' && (
        <div className="space-y-3">
          {today.length ? (
            today.map((r) => <InteractionCard key={r.id} record={r} />)
          ) : (
            <Card className="text-center text-sm text-muted">
              No interactions yet today.
            </Card>
          )}
        </div>
      )}

      {tab === 'routing' && <RoutingLog />}

      {tab === 'emergencies' && <EmergencyTimeline events={emergencies} />}

      {tab === 'handover' && <HandoverNote />}
    </div>
  );
}
