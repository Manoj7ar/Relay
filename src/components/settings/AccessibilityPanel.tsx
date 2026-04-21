import { Card, Toggle } from '@/components/primitives';
import { useSettings } from '@/contexts/SettingsContext';

export function AccessibilityPanel() {
  const { settings, dispatch } = useSettings();
  const { accessibility } = settings;

  return (
    <Card padded={false} className="h-full min-h-0 space-y-3 overflow-hidden p-3">
      <p className="text-xs font-semibold">Accessibility</p>

      <Toggle
        label="High-contrast mode"
        description="WCAG AAA black/white."
        checked={accessibility.highContrast}
        onChange={(v) => dispatch({ type: 'SET_HIGH_CONTRAST', value: v })}
      />

      <Toggle
        label="Larger text"
        description="Scales UI text ~18%."
        checked={accessibility.largeText}
        onChange={(v) => dispatch({ type: 'SET_LARGE_TEXT', value: v })}
      />

      <div className="rounded-xl2 border border-black/10 bg-white/70 p-2">
        <p className="mb-0.5 text-[10px] uppercase tracking-wider text-muted">
          Preview
        </p>
        <p className="text-sm font-semibold">I would like some water.</p>
        <p className="text-xs text-muted">91% · LOW</p>
      </div>
    </Card>
  );
}
