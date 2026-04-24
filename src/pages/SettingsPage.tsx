import { useState } from 'react';
import { AccessibilityPanel } from '@/components/settings/AccessibilityPanel';
import { IntegrationsPanel } from '@/components/settings/IntegrationsPanel';
import { LanguagePanel } from '@/components/settings/LanguagePanel';
import { ModelConfigPanel } from '@/components/settings/ModelConfigPanel';
import { OfflineStatusPanel } from '@/components/settings/OfflineStatusPanel';
import { ProfilePanel } from '@/components/settings/ProfilePanel';
import { RoutingLog } from '@/components/caregiver/RoutingLog';
import { DeveloperPanel } from '@/components/settings/DeveloperPanel';
import { PageHeader } from '@/components/primitives';
import { cn } from '@/lib/cn';

type SettingsSection =
  | 'profile'
  | 'a11y'
  | 'models'
  | 'integrations'
  | 'language'
  | 'offline'
  | 'routing'
  | 'developer';

const SECTIONS: { id: SettingsSection; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'a11y', label: 'Accessibility' },
  { id: 'models', label: 'Models' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'language', label: 'Language' },
  { id: 'offline', label: 'Connectivity' },
  { id: 'routing', label: 'Routing log' },
  { id: 'developer', label: 'Developer' },
];

export function SettingsPage() {
  const [section, setSection] = useState<SettingsSection>('profile');

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden pt-2">
      <PageHeader
        title="Settings"
        subtitle="Preferences, models, and connectivity."
      />

      <div
        role="radiogroup"
        aria-label="Settings section"
        className="mt-2 flex gap-2 overflow-x-auto pb-0.5 scrollbar-none"
      >
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={section === s.id}
            onClick={() => setSection(s.id)}
            className={cn(
              'shrink-0 rounded-full px-4 py-2.5 text-sm font-medium',
              'transition-[color,transform,box-shadow,background-color] duration-fast ease-smooth',
              'active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100',
              section === s.id
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'glass text-text hover:bg-white/75 hover:shadow-sm',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div
        key={section}
        className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden motion-safe:animate-fade-in-fast motion-reduce:animate-none"
      >
        {section === 'profile' && <ProfilePanel />}
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
