import { AccessibilityPanel } from '@/components/settings/AccessibilityPanel';
import { DeveloperPanel } from '@/components/settings/DeveloperPanel';
import { LanguagePanel } from '@/components/settings/LanguagePanel';
import { ModelConfigPanel } from '@/components/settings/ModelConfigPanel';
import { LocalInferencePanel } from '@/components/settings/LocalInferencePanel';
import { OfflineStatusPanel } from '@/components/settings/OfflineStatusPanel';
import { ProfilePanel } from '@/components/settings/ProfilePanel';
import {
  SettingsScreen,
  SettingsSection,
  SettingsStack,
  SettingsSubpageHeader,
} from '@/components/settings/SettingsShell';
import { RoutingLog } from '@/components/caregiver/RoutingLog';

export function SettingsProfilePage() {
  return (
    <SettingsScreen>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <SettingsSubpageHeader
          title="Profile"
          subtitle="Review how Relay knows you. Edit details in onboarding when you need to change something."
        />
        <div className="min-h-0 flex-1 overflow-y-auto pb-8 pt-3">
          <ProfilePanel />
        </div>
      </div>
    </SettingsScreen>
  );
}

export function SettingsLanguagePage() {
  return (
    <SettingsScreen>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <SettingsSubpageHeader
          title="Language"
          subtitle="Languages used for interpretation output and read-back."
        />
        <div className="min-h-0 flex-1 overflow-y-auto pb-8 pt-3">
          <LanguagePanel />
        </div>
      </div>
    </SettingsScreen>
  );
}

export function SettingsAccessibilityPage() {
  return (
    <SettingsScreen>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <SettingsSubpageHeader
          title="Accessibility"
          subtitle="Visual comfort for the whole app."
        />
        <div className="min-h-0 flex-1 overflow-y-auto pb-8 pt-3">
          <AccessibilityPanel />
        </div>
      </div>
    </SettingsScreen>
  );
}

export function SettingsModelsPage() {
  return (
    <SettingsScreen>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <SettingsSubpageHeader
          title="Models & connectivity"
          subtitle="Local Ollama server, model tiers, and a quick connection test."
        />
        <div className="min-h-0 flex-1 overflow-y-auto pb-8 pt-3">
          <SettingsStack>
            <SettingsSection
              title="Connectivity"
              description="Whether the browser can reach the Ollama host (localhost or LAN)."
            >
              <OfflineStatusPanel embedded />
            </SettingsSection>
            <SettingsSection
              title="Inference & privacy"
              description="Where interpretation runs in this build."
            >
              <LocalInferencePanel embedded />
            </SettingsSection>
            <ModelConfigPanel />
          </SettingsStack>
        </div>
      </div>
    </SettingsScreen>
  );
}

export function SettingsRoutingPage() {
  return (
    <SettingsScreen>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <SettingsSubpageHeader
          title="Routing log"
          subtitle="Recent Ollama interpretations and handover tool steps, for debugging."
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden pb-6 pt-3">
          <RoutingLog compact />
        </div>
      </div>
    </SettingsScreen>
  );
}

export function SettingsDeveloperPage() {
  return (
    <SettingsScreen>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <SettingsSubpageHeader
          title="Developer"
          subtitle="What is wired in this build and where to extend it."
        />
        <div className="min-h-0 flex-1 overflow-y-auto pb-8 pt-3">
          <DeveloperPanel />
        </div>
      </div>
    </SettingsScreen>
  );
}
