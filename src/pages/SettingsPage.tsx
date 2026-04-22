import { useState } from 'react';
import { AccessibilityPanel } from '@/components/settings/AccessibilityPanel';
import { IntegrationsPanel } from '@/components/settings/IntegrationsPanel';
import { LanguagePanel } from '@/components/settings/LanguagePanel';
import { ModelConfigPanel } from '@/components/settings/ModelConfigPanel';
import { OfflineStatusPanel } from '@/components/settings/OfflineStatusPanel';
import { RoutingLog } from '@/components/caregiver/RoutingLog';
import { DeveloperPanel } from '@/components/settings/DeveloperPanel';

type SettingsSection =
  | 'a11y'
  | 'models'
  | 'integrations'
  | 'language'
  | 'offline'
  | 'routing'
  | 'developer';

const SECTIONS: { id: SettingsSection; label: string }[] = [
  { id: 'a11y', label: 'Accessibility' },
  { id: 'models', label: 'Models' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'language', label: 'Language' },
  { id: 'offline', label: 'Connectivity' },
  { id: 'routing', label: 'Routing log' },
  { id: 'developer', label: 'Developer' },
];

export function SettingsPage() {
  const [section, setSection] = useState<SettingsSection>('a11y');

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden pt-2">
      <header className="shrink-0 pt-[max(env(safe-area-inset-top),6px)]">
        <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
        <label className="mt-2 block text-[11px] font-medium text-muted">
          Section
          <select
            value={section}
            onChange={(e) => setSection(e.target.value as SettingsSection)}
            className="control-select mt-1"
          >
            {SECTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </header>

      <div className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden">
        {section === 'a11y' && <AccessibilityPanel />}
        {section === 'models' && <ModelConfigPanel />}
        {section === 'integrations' && <IntegrationsPanel />}
        {section === 'language' && <LanguagePanel />}
        {section === 'offline' && <OfflineStatusPanel />}
        {section === 'routing' && (
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <RoutingLog compact />
          </div>
        )}
        {section === 'developer' && (
          <div className="min-h-0 overflow-y-auto">
            <DeveloperPanel />
          </div>
        )}
      </div>
    </div>
  );
}
