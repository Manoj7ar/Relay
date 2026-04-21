import { Card } from '@/components/primitives';
import { InterpreterModePicker } from '@/components/demo/InterpreterModePicker';

/**
 * Developer / capability-layer configuration. Currently exposes the
 * interpreter adapter selector used by `SessionContext.submit`. Grows to
 * include Ollama endpoints, trace logging, etc. once wired.
 */
export function DeveloperPanel() {
  return (
    <div className="flex flex-col gap-2">
      <Card padded={false} className="p-3">
        <h2 className="text-sm font-semibold text-text">Capability layer</h2>
        <p className="mt-0.5 text-[11px] text-muted">
          Permissions, mic capture, STT, TTS, and camera all use real browser
          APIs. The interpretation adapter chosen below decides how the
          transcript turns into a phrase.
        </p>
      </Card>
      <InterpreterModePicker />
      <Card padded={false} className="p-3">
        <h2 className="text-sm font-semibold text-text">Gemma plug-in</h2>
        <p className="mt-0.5 text-[11px] leading-snug text-muted">
          Swap <code>GemmaInterpreterAdapter</code> in
          <code className="mx-1">src/services/interpretation/</code> with a
          real Ollama HTTP client, then flip the mode above to{' '}
          <code>Gemma 4 (local)</code>. See
          <code className="ms-1">docs/GEMMA_AND_INTEGRATIONS.md</code>.
        </p>
      </Card>
    </div>
  );
}
