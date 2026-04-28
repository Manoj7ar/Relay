import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  Cpu,
  Loader2,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { PillButton } from '@/components/primitives';
import { useSettings } from '@/contexts/SettingsContext';
import {
  SettingsControlCard,
  SettingsSection,
  SettingsStack,
} from '@/components/settings/SettingsShell';
import {
  clearAllOllamaModelOverrides,
  hasOllamaModelOverrideStored,
  OLLAMA_MODEL_DEFAULT_TAG,
  readOllamaModelOverrideRaw,
  writeOllamaModelOverride,
} from '@/lib/ollamaModelConfig';
import {
  DEFAULT_OLLAMA_BASE_URL,
  resolveOllamaBaseUrl,
} from '@/lib/ollamaUrl';
import { cn } from '@/lib/cn';
import type { ModelId } from '@/types/model';

const TIER_FIELDS: {
  key: ModelId;
  label: string;
  short: string;
  hint: string;
}[] = [
  {
    key: 'E2B',
    label: 'Fast tier (E2B)',
    short: 'Fast',
    hint: 'Short speech and low-latency paths.',
  },
  {
    key: 'E4B',
    label: 'Fine-tuned tier (E4B)',
    short: 'Tuned',
    hint: 'Symbols and phrase expansion.',
  },
  {
    key: '27B',
    label: 'Quality tier (27B)',
    short: 'Detailed',
    hint: 'Camera + speech and urgent cases.',
  },
];

type TestStatus =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'ok'; models: string[] }
  | { kind: 'fail'; message: string };

function readAllOverrides(): Record<ModelId, string> {
  return {
    E2B: readOllamaModelOverrideRaw('E2B'),
    E4B: readOllamaModelOverrideRaw('E4B'),
    '27B': readOllamaModelOverrideRaw('27B'),
  };
}

function resolvedTag(tier: ModelId): string {
  const raw = readOllamaModelOverrideRaw(tier).trim();
  return raw.length > 0 ? raw : OLLAMA_MODEL_DEFAULT_TAG[tier];
}

export function ModelConfigPanel() {
  const { settings, dispatch } = useSettings();
  const [advOpen, setAdvOpen] = useState(false);
  const [overrides, setOverrides] = useState<Record<ModelId, string>>(() =>
    readAllOverrides(),
  );
  const [status, setStatus] = useState<TestStatus>({ kind: 'idle' });

  const refreshOverrides = useCallback(() => {
    setOverrides(readAllOverrides());
  }, []);

  useEffect(() => {
    refreshOverrides();
  }, [advOpen, refreshOverrides]);

  const updateTier = (tier: ModelId, value: string) => {
    setOverrides((prev) => ({ ...prev, [tier]: value }));
    writeOllamaModelOverride(tier, value);
  };

  const resetOverrides = () => {
    clearAllOllamaModelOverrides();
    refreshOverrides();
  };

  const effectiveBase = resolveOllamaBaseUrl(settings.ollama.baseUrl);
  const customStored = hasOllamaModelOverrideStored();

  const testOllama = async () => {
    setStatus({ kind: 'checking' });
    try {
      const res = await fetch(`${effectiveBase}/api/tags`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        setStatus({
          kind: 'fail',
          message: `Ollama responded with HTTP ${res.status}`,
        });
        return;
      }
      const data = (await res.json()) as { models?: Array<{ name: string }> };
      const models = data.models?.map((m) => m.name) ?? [];
      setStatus({ kind: 'ok', models });
    } catch (err) {
      setStatus({
        kind: 'fail',
        message:
          err instanceof Error
            ? err.message
            : `Ollama not reachable at ${effectiveBase}`,
      });
    }
  };

  const activeLine = TIER_FIELDS.map(
    (f) => `${f.short}: ${resolvedTag(f.key)}`,
  ).join(' · ');

  return (
    <SettingsStack className="text-sm">
      <SettingsSection
        title="Ollama server"
        description="Leave blank to use this device. Use a full URL if Ollama runs on another machine or tunnel."
      >
        <SettingsControlCard className="space-y-2">
          <label className="block text-xs">
            <span className="mb-1.5 block font-medium text-text">
              Base URL (optional)
            </span>
            <input
              type="text"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              placeholder="e.g. http://192.168.1.10:11434"
              value={settings.ollama.baseUrl}
              onChange={(e) =>
                dispatch({ type: 'SET_OLLAMA_BASE_URL', value: e.target.value })
              }
              className="control-input font-mono text-sm"
            />
          </label>
          <p className="text-[10px] leading-snug text-muted">
            Resolves to{' '}
            <span className="break-all font-mono text-text">{effectiveBase}</span>
            . Hosted apps need HTTPS on Ollama and CORS for this origin.
          </p>
        </SettingsControlCard>
      </SettingsSection>

      <SettingsSection
        title="Model tags"
        description="Relay routes each request to a tier; tags default automatically unless you override them in Advanced."
      >
        <SettingsControlCard className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text">
            <Cpu className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Active tags
          </div>
          <p className="break-words font-mono text-[11px] leading-snug text-text">
            {activeLine}
          </p>
          <p className="text-[10px] leading-snug text-muted">
            {customStored
              ? 'Custom overrides on — open Advanced or clear them below.'
              : `Recommended defaults when empty (${DEFAULT_OLLAMA_BASE_URL}).`}
          </p>
        </SettingsControlCard>
      </SettingsSection>

      <SettingsSection title="Advanced">
        <details
          className="rounded-xl2 border border-black/[0.08] bg-white/50 open:border-black/[0.12] open:bg-white/65"
          onToggle={(e) => setAdvOpen(e.currentTarget.open)}
        >
          <summary
            className={cn(
              'flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-xs font-semibold text-text',
              'select-none [&::-webkit-details-marker]:hidden',
            )}
          >
            <span>Ollama model tag overrides</span>
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-muted transition-transform duration-fast ease-smooth',
                advOpen && 'rotate-180',
              )}
              aria-hidden
            />
          </summary>
          <div className="space-y-3 border-t border-black/[0.06] px-3 pb-3 pt-2">
            <p className="text-[10px] leading-snug text-muted">
              Map each tier to a tag from{' '}
              <code className="rounded bg-black/5 px-1">ollama list</code>. Leave
              blank to use the default for that tier.
            </p>

            {TIER_FIELDS.map((field) => (
              <div key={field.key} className="space-y-1">
                <label className="block text-xs">
                  <span className="mb-1 block font-medium">{field.label}</span>
                  <input
                    type="text"
                    value={overrides[field.key]}
                    onChange={(e) => updateTier(field.key, e.target.value)}
                    placeholder={OLLAMA_MODEL_DEFAULT_TAG[field.key]}
                    spellCheck={false}
                    className="control-input font-mono text-sm"
                  />
                </label>
                <p className="text-[10px] leading-snug text-muted">{field.hint}</p>
              </div>
            ))}

            <PillButton
              type="button"
              size="sm"
              variant="ghost"
              onClick={resetOverrides}
              leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}
              className="w-full"
            >
              Clear overrides — use automatic tags
            </PillButton>
          </div>
        </details>
      </SettingsSection>

      <SettingsSection title="Connection test">
        <SettingsControlCard className="space-y-2">
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
                Ollama running · {status.models.length} model
                {status.models.length === 1 ? '' : 's'} available
              </p>
              {status.models.length ? (
                <p className="mt-1 break-words font-mono text-[10px] text-muted">
                  {status.models.join(', ')}
                </p>
              ) : (
                <p className="mt-1 text-muted">
                  No models pulled yet — run{' '}
                  <code className="rounded bg-black/5 px-1">
                    ollama pull gemma4:e2b
                  </code>
                  .
                </p>
              )}
            </div>
          ) : status.kind === 'fail' ? (
            <div className="rounded-xl2 border border-[var(--danger)]/30 bg-[var(--danger)]/[0.06] p-2 text-[11px] leading-snug text-[var(--danger)]">
              <p className="inline-flex items-center gap-1 font-semibold">
                <XCircle className="h-3.5 w-3.5" aria-hidden />
                Ollama not found
              </p>
              <p className="mt-1 text-text">{status.message}</p>
            </div>
          ) : null}
        </SettingsControlCard>
      </SettingsSection>
    </SettingsStack>
  );
}
