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
        <p className="text-sm font-semibold">0 cloud calls</p>
        <p className="text-xs leading-snug text-muted">
          Interpretation uses your configured Gemma on Ollama. Relay does not send
          transcripts to a cloud model for the primary path.
        </p>
      </div>
    </div>
  );

  if (embedded) {
    return <SettingsControlCard>{body}</SettingsControlCard>;
  }

  return (
    <Card padded={false} className="min-h-0 space-y-2 p-3">
      <p className="text-xs font-semibold">Local inference</p>
      {body}
    </Card>
  );
}
