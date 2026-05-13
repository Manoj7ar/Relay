import {
  Activity,
  Cpu,
  Globe2,
  Sparkles,
  UserRound,
  Wrench,
} from 'lucide-react';
import { PageHeader } from '@/components/primitives';
import {
  SettingsHubSection,
  SettingsNavRow,
  SettingsScreen,
} from '@/components/settings/SettingsShell';

export function SettingsHubPage() {
  return (
    <SettingsScreen>
      <div className="shrink-0 pt-0.5">
        <PageHeader
          title="Settings"
          subtitle="Choose a category. This build routes every AI feature through your local Ollama server."
        />
      </div>

      <nav
        aria-label="Settings sections"
        className="mt-3 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pb-8"
      >
        <SettingsHubSection title="You & language">
          <SettingsNavRow
            to="/settings/profile"
            icon={<UserRound className="h-5 w-5" aria-hidden />}
            title="Profile"
            description="Name, condition, caregiver, voice samples, and phrases."
          />
          <SettingsNavRow
            to="/settings/language"
            icon={<Globe2 className="h-5 w-5" aria-hidden />}
            title="Language"
            description="Patient and caregiver languages for interpretation and TTS."
          />
        </SettingsHubSection>

        <SettingsHubSection title="Relay & device">
          <SettingsNavRow
            to="/settings/accessibility"
            icon={<Sparkles className="h-5 w-5" aria-hidden />}
            title="Accessibility"
            description="High contrast and larger text."
          />
          <SettingsNavRow
            to="/settings/models"
            icon={<Cpu className="h-5 w-5" aria-hidden />}
            title="Models & connectivity"
            description="Local Ollama URL, model tiers, and connection test."
          />
        </SettingsHubSection>

        <SettingsHubSection title="Diagnostics">
          <SettingsNavRow
            to="/settings/routing"
            icon={<Activity className="h-5 w-5" aria-hidden />}
            title="Routing log"
            description="Recent Ollama interpretations and handover tool steps."
          />
          <SettingsNavRow
            to="/settings/developer"
            icon={<Wrench className="h-5 w-5" aria-hidden />}
            title="Developer"
            description="Capability checklist and architecture links."
          />
        </SettingsHubSection>
      </nav>
    </SettingsScreen>
  );
}
