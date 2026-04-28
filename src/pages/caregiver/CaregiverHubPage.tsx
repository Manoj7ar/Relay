import {
  Activity,
  AlertTriangle,
  BookMarked,
  ClipboardList,
  MessageCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/primitives';
import {
  CaregiverHubSection,
  CaregiverNavRow,
  CaregiverScreen,
} from '@/components/caregiver/CaregiverShell';

export function CaregiverHubPage() {
  return (
    <CaregiverScreen>
      <div className="shrink-0 pt-0.5">
        <PageHeader
          title="Caregiver"
          subtitle="Today's interactions, dictionary, routing, alerts, and handover notes."
        />
      </div>

      <nav
        aria-label="Caregiver sections"
        className="mt-3 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pb-8"
      >
        <CaregiverHubSection title="Today">
          <CaregiverNavRow
            to="/caregiver/today"
            icon={<MessageCircle className="h-5 w-5" aria-hidden />}
            title="Today"
            description="Recent interpretations from the patient home with mood and urgency."
          />
        </CaregiverHubSection>

        <CaregiverHubSection title="Reference">
          <CaregiverNavRow
            to="/caregiver/dictionary"
            icon={<BookMarked className="h-5 w-5" aria-hidden />}
            title="Dictionary"
            description="Patient-specific phrases and how Relay should read them."
          />
          <CaregiverNavRow
            to="/caregiver/routing"
            icon={<Activity className="h-5 w-5" aria-hidden />}
            title="Routing"
            description="Which model tier handled recent interpretations."
          />
        </CaregiverHubSection>

        <CaregiverHubSection title="Alerts & continuity">
          <CaregiverNavRow
            to="/caregiver/alerts"
            icon={<AlertTriangle className="h-5 w-5" aria-hidden />}
            title="Alerts"
            description="HIGH urgency items from the session timeline."
          />
          <CaregiverNavRow
            to="/caregiver/handover"
            icon={<ClipboardList className="h-5 w-5" aria-hidden />}
            title="Handover"
            description="Summary note for the next caregiver or visit."
          />
        </CaregiverHubSection>
      </nav>
    </CaregiverScreen>
  );
}
