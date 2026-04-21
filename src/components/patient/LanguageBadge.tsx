import { Languages } from 'lucide-react';
import { StatusBadge } from '@/components/primitives';

interface LanguageBadgeProps {
  language: string;
}

interface LangMeta {
  flag: string;
  name: string;
}

const LANG_META: Record<string, LangMeta> = {
  'en-US': { flag: '🇺🇸', name: 'English' },
  'en-GB': { flag: '🇬🇧', name: 'English (UK)' },
  en: { flag: '🇬🇧', name: 'English' },
  pl: { flag: '🇵🇱', name: 'Polski' },
  'pl-PL': { flag: '🇵🇱', name: 'Polski' },
  ar: { flag: '🇸🇦', name: 'العربية' },
  'ar-EG': { flag: '🇪🇬', name: 'العربية' },
  'ar-SA': { flag: '🇸🇦', name: 'العربية' },
  'es-ES': { flag: '🇪🇸', name: 'Español' },
  es: { flag: '🇪🇸', name: 'Español' },
  'fr-FR': { flag: '🇫🇷', name: 'Français' },
  fr: { flag: '🇫🇷', name: 'Français' },
  'de-DE': { flag: '🇩🇪', name: 'Deutsch' },
  de: { flag: '🇩🇪', name: 'Deutsch' },
  'hi-IN': { flag: '🇮🇳', name: 'हिन्दी' },
  hi: { flag: '🇮🇳', name: 'हिन्दी' },
};

const FALLBACK: LangMeta = { flag: '🌐', name: '' };

export function LanguageBadge({ language }: LanguageBadgeProps) {
  const base = language.split('-')[0] ?? language;
  const meta =
    LANG_META[language] ??
    LANG_META[base] ??
    { ...FALLBACK, name: language };

  return (
    <StatusBadge
      icon={<Languages className="h-3.5 w-3.5" aria-hidden />}
      className="text-[11px]"
    >
      <span aria-hidden className="me-1">
        {meta.flag}
      </span>
      {meta.name}
    </StatusBadge>
  );
}
