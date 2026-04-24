/**
 * Primary languages users can pick (Settings + home header switcher).
 * Keep in sync with speech / Gemma prompt expectations (BCP-47).
 */
export const PRIMARY_LANGUAGE_OPTIONS = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'es-ES', label: 'Español' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'de-DE', label: 'Deutsch' },
  { code: 'ar-EG', label: 'العربية' },
  { code: 'hi-IN', label: 'हिन्दी' },
] as const;

const DISPLAY: Record<string, { flag: string; short: string }> = {
  'en-US': { flag: '🇺🇸', short: 'English' },
  'en-GB': { flag: '🇬🇧', short: 'English (UK)' },
  en: { flag: '🇬🇧', short: 'English' },
  'es-ES': { flag: '🇪🇸', short: 'Español' },
  es: { flag: '🇪🇸', short: 'Español' },
  'fr-FR': { flag: '🇫🇷', short: 'Français' },
  fr: { flag: '🇫🇷', short: 'Français' },
  'de-DE': { flag: '🇩🇪', short: 'Deutsch' },
  de: { flag: '🇩🇪', short: 'Deutsch' },
  'ar-EG': { flag: '🇪🇬', short: 'العربية' },
  'ar-SA': { flag: '🇸🇦', short: 'العربية' },
  ar: { flag: '🇸🇦', short: 'العربية' },
  'hi-IN': { flag: '🇮🇳', short: 'हिन्दी' },
  hi: { flag: '🇮🇳', short: 'हिन्दी' },
  pl: { flag: '🇵🇱', short: 'Polski' },
  'pl-PL': { flag: '🇵🇱', short: 'Polski' },
};

/**
 * Flag + short label for any BCP-47 tag (e.g. model-detected language).
 */
export function resolveLanguageDisplay(code: string): {
  flag: string;
  short: string;
} {
  const trimmed = code.trim();
  if (!trimmed) return { flag: '🌐', short: '' };
  const exact = DISPLAY[trimmed];
  if (exact) return exact;
  const base = trimmed.split('-')[0] ?? trimmed;
  const baseMeta = DISPLAY[base];
  if (baseMeta) return baseMeta;
  return { flag: '🌐', short: trimmed };
}
