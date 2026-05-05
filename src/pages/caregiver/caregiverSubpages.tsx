import { MessageCircle } from 'lucide-react';
import { InteractionCard } from '@/components/caregiver/InteractionCard';
import { RoutingLog } from '@/components/caregiver/RoutingLog';
import { EmergencyTimeline } from '@/components/caregiver/EmergencyTimeline';
import { HandoverNote } from '@/components/caregiver/HandoverNote';
import { PatientDictionaryPanel } from '@/components/caregiver/PatientDictionaryPanel';
import {
  CaregiverScreen,
  CaregiverSubpageHeader,
} from '@/components/caregiver/CaregiverShell';
import { SessionInsightCard } from '@/components/caregiver/SessionInsightCard';
import { Card } from '@/components/primitives';
import { useCaregiverSessionSlices } from '@/hooks/useCaregiverSessionSlices';

const MAX_VISIBLE = 2;

export function CaregiverTodayPage() {
  const { today } = useCaregiverSessionSlices();
  const visibleToday = today.slice(0, MAX_VISIBLE);
  const restToday = Math.max(0, today.length - MAX_VISIBLE);

  return (
    <CaregiverScreen>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CaregiverSubpageHeader
          title="Today"
          subtitle="Interpretations from today with mood and urgency."
        />
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pb-8 pt-3">
          <SessionInsightCard />
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
      </div>
    </CaregiverScreen>
  );
}

export function CaregiverDictionaryPage() {
  return (
    <CaregiverScreen>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CaregiverSubpageHeader
          title="Dictionary"
          subtitle="Patient-specific phrases and preferred phrasing for read-back."
        />
        <div className="min-h-0 flex-1 overflow-hidden pb-6 pt-3">
          <PatientDictionaryPanel compact />
        </div>
      </div>
    </CaregiverScreen>
  );
}

export function CaregiverRoutingPage() {
  return (
    <CaregiverScreen>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CaregiverSubpageHeader
          title="Routing"
          subtitle="Which model tier handled recent interpretations."
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden pb-6 pt-3">
          <RoutingLog compact />
        </div>
      </div>
    </CaregiverScreen>
  );
}

export function CaregiverAlertsPage() {
  const { emergencies } = useCaregiverSessionSlices();

  return (
    <CaregiverScreen>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CaregiverSubpageHeader
          title="Alerts"
          subtitle="HIGH urgency items from the session timeline."
        />
        <div className="min-h-0 flex-1 overflow-hidden pb-6 pt-3">
          <EmergencyTimeline events={emergencies} compact />
        </div>
      </div>
    </CaregiverScreen>
  );
}

export function CaregiverHandoverPage() {
  return (
    <CaregiverScreen>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CaregiverSubpageHeader
          title="Handover"
          subtitle="Summary for the next caregiver or visit."
        />
        <div className="min-h-0 flex-1 overflow-hidden pb-6 pt-3">
          <HandoverNote compact />
        </div>
      </div>
    </CaregiverScreen>
  );
}
