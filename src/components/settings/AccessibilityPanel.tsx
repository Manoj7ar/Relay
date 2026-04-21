import { Card, Toggle } from '@/components/primitives';
import { useSettings } from '@/contexts/SettingsContext';

export function AccessibilityPanel() {
  const { settings, dispatch } = useSettings();
  const { accessibility } = settings;

  return (
    <Card className="space-y-5">
      <p className="text-sm font-semibold">Accessibility</p>

      <Toggle
        label="High-contrast mode"
        description="Pure black/white palette meeting WCAG AAA."
        checked={accessibility.highContrast}
        onChange={(v) => dispatch({ type: 'SET_HIGH_CONTRAST', value: v })}
      />

      <Toggle
        label="Larger text"
        description="Scales font sizes across the app by ~18%."
        checked={accessibility.largeText}
        onChange={(v) => dispatch({ type: 'SET_LARGE_TEXT', value: v })}
      />

      <div className="rounded-xl2 border border-black/10 bg-white/70 p-4">
        <p className="mb-1 text-[11px] uppercase tracking-wider text-muted">
          Preview
        </p>
        <p className="text-lg font-semibold">I would like some water.</p>
        <p className="text-sm text-muted">Confidence 91% · LOW urgency</p>
      </div>
    </Card>
  );
}
