import { useMemo, useState } from 'react';
import { PatientHeader } from '@/components/caregiver/PatientHeader';
import { SegmentedTabs } from '@/components/caregiver/SegmentedTabs';
import { InteractionCard } from '@/components/caregiver/InteractionCard';
import { RoutingLog } from '@/components/caregiver/RoutingLog';
import { EmergencyTimeline } from '@/components/caregiver/EmergencyTimeline';
import { HandoverNote } from '@/components/caregiver/HandoverNote';
import { PatientDictionaryPanel } from '@/components/caregiver/PatientDictionaryPanel';
import { AlertTriangle, MessageCircle } from 'lucide-react';
import { Card, PageHeader } from '@/components/primitives';
import { useSession } from '@/contexts/SessionContext';
import { detectDistressPattern } from '@/lib/distressDetector';

type Tab = 'today' | 'dictionary' | 'routing' | 'emergencies' | 'handover';

const MAX_VISIBLE = 2;

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
  const distressPattern = useMemo(
    () => detectDistressPattern(state.history),
    [state.history],
  );

  const visibleToday = today.slice(0, MAX_VISIBLE);
  const restToday = Math.max(0, today.length - MAX_VISIBLE);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden pt-2">
      <PageHeader
        title="Caregiver"
        subtitle="Today's interactions and routing."
      />
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

      <div className="shrink-0">
        <SegmentedTabs
          label="Caregiver sections"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'today', label: 'Today' },
            { value: 'dictionary', label: 'Dictionary' },
            { value: 'routing', label: 'Routing' },
            { value: 'emergencies', label: 'Alerts' },
            { value: 'handover', label: 'Handover' },
          ]}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {tab === 'today' && (
          <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
            {visibleToday.length ? (
              <>
                {visibleToday.map((r, i) => (
                  <InteractionCard
                    key={r.id}
                    record={r}
                    compact
                    listIndex={i}
                  />
                ))}
                {restToday > 0 ? (
                  <p className="text-center text-xs text-muted">
                    +{restToday} more in history
                  </p>
                ) : null}
              </>
            ) : (
              <Card className="flex flex-col items-center gap-2 py-8 text-center">
                <MessageCircle
                  className="h-9 w-9 text-muted/70"
                  aria-hidden
                />
                <p className="text-xs font-medium text-text">No interactions yet today</p>
                <p className="max-w-[260px] text-[11px] leading-snug text-muted">
                  Interpretations from the patient home appear here with mood and urgency.
                </p>
              </Card>
            )}
          </div>
        )}

        {tab === 'routing' && (
          <div className="h-full min-h-0 overflow-hidden">
            <RoutingLog compact />
          </div>
        )}

        {tab === 'dictionary' && (
          <div className="h-full min-h-0 overflow-hidden">
            <PatientDictionaryPanel compact />
          </div>
        )}

        {tab === 'emergencies' && (
          <div className="h-full min-h-0 overflow-hidden">
            <EmergencyTimeline events={emergencies} compact />
          </div>
        )}

        {tab === 'handover' && (
          <div className="h-full min-h-0 overflow-hidden">
            <HandoverNote compact />
          </div>
        )}
      </div>
    </div>
  );
}
