import { Languages } from 'lucide-react';
import { StatusBadge } from '@/components/primitives';
import { resolveLanguageDisplay } from '@/lib/relayLanguages';

interface LanguageBadgeProps {
  language: string;
}

/** Read-only badge (e.g. caregiver views). For the patient home header use the conversation dropdown. */
export function LanguageBadge({ language }: LanguageBadgeProps) {
  const meta = resolveLanguageDisplay(language);

  return (
    <StatusBadge
      icon={<Languages className="h-3.5 w-3.5" aria-hidden />}
      className="text-[11px]"
    >
      <span aria-hidden className="me-1">
        {meta.flag}
      </span>
      {meta.short || language}
    </StatusBadge>
  );
}
