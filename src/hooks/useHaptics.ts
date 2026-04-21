type Pattern = 'tap' | 'success' | 'warn' | 'emergency';

const patterns: Record<Pattern, number | number[]> = {
  tap: 12,
  success: [20, 50, 20],
  warn: [60, 40, 60],
  emergency: [200, 100, 200, 100, 400],
};

export function useHaptics(): (pattern: Pattern) => void {
  // TODO: wire to native Haptics via a Capacitor/Cordova bridge when wrapped.
  return (pattern) => {
    if (typeof navigator === 'undefined') return;
    const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
    if (typeof nav.vibrate === 'function') nav.vibrate(patterns[pattern]);
  };
}
