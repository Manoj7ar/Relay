import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Cpu,
  Loader2,
  XCircle,
} from 'lucide-react';
import { PillButton } from '@/components/primitives';
import {
  SettingsControlCard,
  SettingsSection,
  SettingsStack,
} from '@/components/settings/SettingsShell';
import {
  DEFAULT_OLLAMA_MODEL,
  DEFAULT_OLLAMA_STT_MODEL,
  DEFAULT_OLLAMA_VISION_MODEL,
  GemmaNotConnectedError,
  getOllamaModel,
  getOllamaSttModel,
  getOllamaVisionModel,
  isOllamaConfigured,
} from '@/lib/ollamaConfig';
import { checkOllamaModel } from '@/services/interpretation/ollamaApi';

type TestStatus =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'ok' }
  | { kind: 'fail'; message: string };

export function ModelConfigPanel() {
  const [status, setStatus] = useState<TestStatus>({ kind: 'idle' });
  const model = getOllamaModel();
  const visionModel = getOllamaVisionModel();
  const sttModel = getOllamaSttModel();
  const configured = isOllamaConfigured();

  useEffect(() => {
    setStatus({ kind: 'idle' });
  }, [model, visionModel, sttModel, configured]);

  const testOllama = useCallback(async () => {
    setStatus({ kind: 'checking' });
    try {
      await checkOllamaModel();
      setStatus({ kind: 'ok' });
    } catch (err) {
      const message =
        err instanceof GemmaNotConnectedError
          ? err.surface.hint ?? err.surface.title
          : err instanceof Error
            ? err.message
            : 'Ollama is not reachable.';
      setStatus({ kind: 'fail', message });
    }
  }, []);

  return (
    <SettingsStack className="text-sm">
      <SettingsSection
        title="Ollama"
        description="Patient interpretation and caregiver handover use Ollama (OpenAI-compatible API). Dev server proxies /__ollama to localhost:11434."
      >
        <SettingsControlCard className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text">
            <Cpu className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Model
          </div>
          <p className="break-words font-mono text-[11px] leading-snug text-text">
            {model}
          </p>
          <p className="text-[10px] leading-snug text-muted">
            {model === DEFAULT_OLLAMA_MODEL
              ? 'Default unless VITE_RELAY_OLLAMA_MODEL is set.'
              : 'From VITE_RELAY_OLLAMA_MODEL in .env.local.'}
          </p>
          <div className="flex items-center gap-1.5 pt-1 text-xs font-semibold text-text">
            <Cpu className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Vision model
          </div>
          <p className="break-words font-mono text-[11px] leading-snug text-text">
            {visionModel}
          </p>
          <p className="text-[10px] leading-snug text-muted">
            Used when a photo is sent with the message. Override with{' '}
            <code className="rounded bg-black/5 px-1">VITE_RELAY_OLLAMA_VISION_MODEL</code>
            {visionModel === DEFAULT_OLLAMA_VISION_MODEL
              ? ' (shown value is the built-in default).'
              : ' in .env.local.'}
          </p>
          <div className="flex items-center gap-1.5 pt-1 text-xs font-semibold text-text">
            <Cpu className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Speech-to-text (tap mic)
          </div>
          <p className="break-words font-mono text-[11px] leading-snug text-text">
            {sttModel}
          </p>
          <p className="text-[10px] leading-snug text-muted">
            Ollama Whisper before chat interpret. Override with{' '}
            <code className="rounded bg-black/5 px-1">VITE_RELAY_LOCAL_STT_MODEL</code>
            {sttModel === DEFAULT_OLLAMA_STT_MODEL
              ? ' (built-in default).'
              : ' in .env.local.'}
          </p>
          {!configured ? (
            <p className="rounded-xl2 border border-[var(--danger)]/30 bg-[var(--danger)]/[0.06] p-2 text-[11px] leading-snug text-[var(--danger)]">
              Set <code className="rounded bg-black/5 px-1">VITE_RELAY_OLLAMA_BASE_URL</code> in{' '}
              <code className="rounded bg-black/5 px-1">.env.local</code> and restart{' '}
              <code className="rounded bg-black/5 px-1">npm run dev</code>.
            </p>
          ) : null}
        </SettingsControlCard>
      </SettingsSection>

      <SettingsSection title="Connection test">
        <SettingsControlCard className="space-y-2">
          <p className="text-[10px] leading-snug text-muted">
            Sends a tiny text-only request using your <strong className="font-semibold">text</strong>{' '}
            model ({model}). It does not exercise the vision model.
          </p>
          <PillButton
            size="sm"
            variant="accent"
            onClick={testOllama}
            disabled={status.kind === 'checking'}
            leftIcon={
              status.kind === 'checking' ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Cpu className="h-4 w-4" aria-hidden />
              )
            }
          >
            {status.kind === 'checking' ? 'Checking…' : 'Test Ollama'}
          </PillButton>

          {status.kind === 'ok' ? (
            <div className="rounded-xl2 border border-emerald-500/30 bg-emerald-500/5 p-2 text-[11px] leading-snug">
              <p className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                Ollama reachable
              </p>
              <p className="mt-1 break-words font-mono text-[10px] text-muted">
                {model}
              </p>
            </div>
          ) : status.kind === 'fail' ? (
            <div className="rounded-xl2 border border-[var(--danger)]/30 bg-[var(--danger)]/[0.06] p-2 text-[11px] leading-snug text-[var(--danger)]">
              <p className="inline-flex items-center gap-1 font-semibold">
                <XCircle className="h-3.5 w-3.5" aria-hidden />
                Ollama not ready
              </p>
              <p className="mt-1 text-text">{status.message}</p>
            </div>
          ) : null}
        </SettingsControlCard>
      </SettingsSection>
    </SettingsStack>
  );
}
