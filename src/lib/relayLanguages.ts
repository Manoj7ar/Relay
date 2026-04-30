/**
 * Primary languages users can pick (Settings + home header switcher).
 * Options are FLORES-200–aligned BCP-47 tags (see relayLanguages.generated.ts).
 * Gemma docs cite 140+ pretrained languages without publishing an official list.
 */
import { PRIMARY_LANGUAGE_OPTIONS as FLORES_PRIMARY_OPTIONS } from '@/lib/relayLanguages.generated';

/** Regional / legacy tags useful for speech variants, merged into the main list. */
const EXTRA_PRIMARY_OPTIONS: { code: string; label: string }[] = [
  { code: 'en', label: 'English (generic)' },
  { code: 'en-GB', label: 'English (United Kingdom)' },
];

export const PRIMARY_LANGUAGE_OPTIONS: readonly {
  code: string;
  label: string;
}[] = [...FLORES_PRIMARY_OPTIONS, ...EXTRA_PRIMARY_OPTIONS].sort((a, b) =>
  a.label.localeCompare(b.label, 'en'),
);

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
  zh: { flag: '🇨🇳', short: '中文' },
  'zh-Hans': { flag: '🇨🇳', short: 'Chinese (Simplified)' },
  'zh-Hant': { flag: '🇹🇼', short: 'Chinese (Traditional)' },
  pt: { flag: '🇵🇹', short: 'Português' },
  ja: { flag: '🇯🇵', short: '日本語' },
  ko: { flag: '🇰🇷', short: '한국어' },
  ru: { flag: '🇷🇺', short: 'Русский' },
  tr: { flag: '🇹🇷', short: 'Türkçe' },
  vi: { flag: '🇻🇳', short: 'Tiếng Việt' },
  th: { flag: '🇹🇭', short: 'ไทย' },
  id: { flag: '🇮🇩', short: 'Bahasa Indonesia' },
};

let displayNamesEn: Intl.DisplayNames | null | undefined;

function languageShortLabel(code: string): string {
  const trimmed = code.trim();
  if (!trimmed) return '';
  if (typeof Intl !== 'undefined' && 'DisplayNames' in Intl) {
    if (displayNamesEn === undefined) {
      try {
        displayNamesEn = new Intl.DisplayNames(['en'], { type: 'language' });
      } catch {
        displayNamesEn = null;
      }
    }
    const base = trimmed.split('-')[0]?.toLowerCase() ?? trimmed;
    try {
      const label = displayNamesEn?.of(base);
      if (label) {
        const rest = trimmed.slice(base.length).replace(/^-/, '');
        return rest ? `${label} (${rest})` : label;
      }
    } catch {
      /* ignore */
    }
  }
  return trimmed;
}

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
  const primary = trimmed.split('-')[0] ?? trimmed;
  const lowerPrimary = primary.toLowerCase();
  const baseMeta =
    DISPLAY[primary] ?? DISPLAY[lowerPrimary] ?? DISPLAY[trimmed.toLowerCase()];
  if (baseMeta) return baseMeta;
  return { flag: '🌐', short: languageShortLabel(trimmed) };
}
