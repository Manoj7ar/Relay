import { languageBase } from '@/lib/bilingualHero';
import { PRIMARY_LANGUAGE_OPTIONS } from '@/lib/relayLanguages';

const BASE_INDEX: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const { code } of PRIMARY_LANGUAGE_OPTIONS) {
    const b = languageBase(code);
    if (!m.has(b)) m.set(b, code);
  }
  return m;
})();

/**
 * Map Gemma/Web Speech `detectedLanguage` to the nearest option in our picker.
 */
export function normalizeDetectedToSupportedLocale(detected: string): string | null {
  const d = detected.trim();
  if (!d) return null;
  if (PRIMARY_LANGUAGE_OPTIONS.some((o) => o.code === d)) return d;
  const base = languageBase(d);
  return BASE_INDEX.get(base) ?? null;
}

export function shouldAutoAdaptFromInterpretation(
  autoAdaptEnabled: boolean,
  ambiguous: boolean | undefined,
  confidence: number,
): boolean {
  if (!autoAdaptEnabled || ambiguous) return false;
  return confidence >= 0.52;
}
