import { useState } from 'react';
import { AccessibilityPanel } from '@/components/settings/AccessibilityPanel';
import { IntegrationsPanel } from '@/components/settings/IntegrationsPanel';
import { LanguagePanel } from '@/components/settings/LanguagePanel';
import { OfflineStatusPanel } from '@/components/settings/OfflineStatusPanel';
import { RoutingLog } from '@/components/caregiver/RoutingLog';
import { DeveloperPanel } from '@/components/settings/DeveloperPanel';

type SettingsSection =
  | 'a11y'
  | 'integrations'
  | 'language'
  | 'offline'
  | 'routing'
  | 'developer';

const SECTIONS: { id: SettingsSection; label: string }[] = [
  { id: 'a11y', label: 'Accessibility' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'language', label: 'Language' },
  { id: 'offline', label: 'Connectivity' },
  { id: 'routing', label: 'Routing log' },
  { id: 'developer', label: 'Developer' },
];

export function SettingsPage() {
  const [section, setSection] = useState<SettingsSection>('a11y');

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pt-2">
      <header className="shrink-0 pt-[max(env(safe-area-inset-top),6px)]">
        <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
        <label className="mt-2 block text-[11px] font-medium text-muted">
          Section
          <select
            value={section}
            onChange={(e) => setSection(e.target.value as SettingsSection)}
            className="mt-1 w-full rounded-full border border-black/10 bg-white/80 px-3 py-2.5 text-sm font-medium text-text focus:outline-none"
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
