import { Card, Toggle } from '@/components/primitives';
import { useSettings } from '@/contexts/SettingsContext';

export function DemoModeToggle() {
  const { settings, dispatch } = useSettings();
  return (
    <Card className="space-y-1">
      <Toggle
        label="Demo mode"
        description="Disables real microphone, camera, and network calls."
        checked={settings.demoMode}
        onChange={(v) => dispatch({ type: 'SET_DEMO_MODE', value: v })}
      />
    </Card>
  );
}
