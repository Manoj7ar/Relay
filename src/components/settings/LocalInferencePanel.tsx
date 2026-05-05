import { ShieldCheck } from 'lucide-react';
import { Card } from '@/components/primitives';
import { SettingsControlCard } from '@/components/settings/SettingsShell';

export function LocalInferencePanel({ embedded }: { embedded?: boolean }) {
  const body = (
    <div className="flex items-center gap-3">
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white">
        <ShieldCheck className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold">Ollama</p>
        <p className="text-xs leading-snug text-muted">
          Relay routes AI features through Ollama. Tap-to-speak uses Ollama Whisper
          (speech-to-text) then Ollama chat for interpretation.
        </p>
      </div>
    </div>
  );

  if (embedded) {
    return <SettingsControlCard>{body}</SettingsControlCard>;
  }

  return (
    <Card padded={false} className="min-h-0 space-y-2 p-3">
      <p className="text-xs font-semibold">Ollama inference</p>
      {body}
    </Card>
  );
}
