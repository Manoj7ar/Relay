import { CloudOff, Cpu } from 'lucide-react';
import { StatusBadge } from '@/components/primitives';
import { useSettings } from '@/contexts/SettingsContext';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useOllamaStatus } from '@/hooks/useOllamaStatus';

/**
 * Network + local Gemma (Ollama) status for the patient header.
 * Tier labels (E2B / E4B / 27B) stay in the caregiver routing log only.
 */
const badgeCls =
  'text-[11px] max-[379px]:min-h-11 max-[379px]:items-center max-[379px]:py-2';

export function ConnectionBadge() {
  const online = useOnlineStatus();
  const { settings } = useSettings();
  const ollama = useOllamaStatus(settings.ollama.baseUrl);

  if (!online) {
    return (
      <StatusBadge
        tone="warn"
        dot
        icon={
          <CloudOff
            className="h-4 w-4 min-[380px]:h-3.5 min-[380px]:w-3.5"
            aria-hidden
          />
        }
        className={badgeCls}
        labelClassName="vp-narrow-sr-only"
      >
        Offline
      </StatusBadge>
    );
  }

  if (ollama === 'running') {
    return (
      <StatusBadge
        tone="ok"
        dot
        icon={
          <Cpu
            className="h-4 w-4 min-[380px]:h-3.5 min-[380px]:w-3.5"
            aria-hidden
          />
        }
        className={badgeCls}
        labelClassName="vp-narrow-sr-only"
      >
        Gemma online
      </StatusBadge>
    );
  }

  if (ollama === 'checking') {
    return (
      <StatusBadge
        tone="neutral"
        dot
        icon={
          <Cpu
            className="h-4 w-4 min-[380px]:h-3.5 min-[380px]:w-3.5"
            aria-hidden
          />
        }
        className={badgeCls}
        labelClassName="vp-narrow-sr-only"
      >
        Gemma…
      </StatusBadge>
    );
  }

  return (
    <StatusBadge
      tone="warn"
      dot
      icon={
        <Cpu
          className="h-4 w-4 min-[380px]:h-3.5 min-[380px]:w-3.5"
          aria-hidden
        />
      }
      className={badgeCls}
      labelClassName="vp-narrow-sr-only"
    >
      Gemma offline
    </StatusBadge>
  );
}
