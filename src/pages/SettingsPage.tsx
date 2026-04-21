import { VoiceBankingWizard } from '@/components/settings/VoiceBankingWizard';
import { AccessibilityPanel } from '@/components/settings/AccessibilityPanel';
import { IntegrationsPanel } from '@/components/settings/IntegrationsPanel';
import { LanguagePanel } from '@/components/settings/LanguagePanel';
import { OfflineStatusPanel } from '@/components/settings/OfflineStatusPanel';
import { PersonalizationPanel } from '@/components/settings/PersonalizationPanel';
import { RoutingLog } from '@/components/caregiver/RoutingLog';

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-4 px-4 pt-2">
      <header className="safe-top">
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted">
          Onboarding, accessibility, and integrations.
        </p>
      </header>

      <VoiceBankingWizard />
      <PersonalizationPanel />
      <AccessibilityPanel />
      <IntegrationsPanel />
      <LanguagePanel />
      <OfflineStatusPanel />

      <section>
        <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
          Model routing log
        </h2>
        <RoutingLog />
      </section>
    </div>
  );
}
