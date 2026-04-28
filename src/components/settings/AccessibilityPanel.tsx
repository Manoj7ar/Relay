import { Toggle } from '@/components/primitives';
import { useSettings } from '@/contexts/SettingsContext';
import {
  SettingsControlCard,
  SettingsSection,
  SettingsStack,
} from '@/components/settings/SettingsShell';

export function AccessibilityPanel() {
  const { settings, dispatch } = useSettings();
  const { accessibility } = settings;

  return (
    <SettingsStack>
      <SettingsSection
        title="Display"
        description="These apply across Relay immediately."
      >
        <SettingsControlCard className="space-y-1 divide-y divide-black/[0.06]">
          <div className="pb-3">
            <Toggle
              label="High-contrast mode"
              description="Strong black/white for readability."
              checked={accessibility.highContrast}
              onChange={(v) => dispatch({ type: 'SET_HIGH_CONTRAST', value: v })}
            />
          </div>
          <div className="pt-3">
            <Toggle
              label="Larger text"
              description="Scales interface text about 18%."
              checked={accessibility.largeText}
              onChange={(v) => dispatch({ type: 'SET_LARGE_TEXT', value: v })}
            />
          </div>
        </SettingsControlCard>
      </SettingsSection>

      <SettingsSection title="Preview">
        <SettingsControlCard>
          <p className="text-sm font-semibold">I would like some water.</p>
          <p className="mt-1 text-xs text-muted">Example line · LOW urgency</p>
        </SettingsControlCard>
      </SettingsSection>
    </SettingsStack>
  );
}
