import { Languages } from 'lucide-react';
import { StatusBadge } from '@/components/primitives';

interface LanguageBadgeProps {
  language: string;
}

const NAMES: Record<string, string> = {
  'en-US': 'English',
  'en-GB': 'English (UK)',
  'es-ES': 'Español',
  'ar-EG': 'العربية',
  'fr-FR': 'Français',
  'de-DE': 'Deutsch',
  'hi-IN': 'हिन्दी',
};

export function LanguageBadge({ language }: LanguageBadgeProps) {
  const label = NAMES[language] ?? language;
  return (
    <StatusBadge
      icon={<Languages className="h-3.5 w-3.5" aria-hidden />}
      className="text-[11px]"
    >
      {label}
    </StatusBadge>
  );
}
