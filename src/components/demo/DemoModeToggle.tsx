import { Card, Toggle } from '@/components/primitives';
import { useSettings } from '@/contexts/SettingsContext';

export function DemoModeToggle() {
  const { settings, dispatch } = useSettings();
  return (
    <Card padded={false} className="p-3">
      <Toggle
        label="Demo mode"
        description="Mocks mic, camera, and network."
        checked={settings.demoMode}
        onChange={(v) => dispatch({ type: 'SET_DEMO_MODE', value: v })}
      />
    </Card>
  );
}
