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
import { useSettings } from '@/contexts/SettingsContext';
import {
  OLLAMA_MODEL_DEFAULT_TAG,
  getOllamaModelTagForTier,
  readOllamaModelOverrideRaw,
} from '@/lib/ollamaModelConfig';
import {
  DEFAULT_OLLAMA_BASE_URL,
  normalizeOllamaBaseUrl,
  resolveOllamaBaseUrl,
} from '@/lib/ollamaUrl';

type TestStatus =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'ok'; tags: string[] }
  | { kind: 'fail'; message: string };

const TIER_LABELS: Record<'E2B' | 'E4B' | '27B', string> = {
  E2B: 'Real-time tier',
  E4B: 'Fine-tuned tier',
  '27B': 'Reasoning / vision tier',
};

interface OllamaTagsResponse {
  models?: Array<{ name?: string }>;
}

async function probeOllama(baseUrl: string): Promise<string[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8_000);
  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const body = (await res.json()) as OllamaTagsResponse;
    const tags = (body.models ?? [])
      .map((entry) => (entry.name ?? '').trim())
      .filter(Boolean);
    return tags;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function ModelConfigPanel() {
  const { settings, dispatch } = useSettings();
  const [status, setStatus] = useState<TestStatus>({ kind: 'idle' });
  const [draftUrl, setDraftUrl] = useState(settings.ollama.baseUrl);
  const [urlError, setUrlError] = useState<string | null>(null);

  const storedBase = settings.ollama.baseUrl.trim();
  const effectiveBaseUrl = resolveOllamaBaseUrl(settings.ollama.baseUrl);
  const fastTag = getOllamaModelTagForTier('E2B');
  const fineTag = getOllamaModelTagForTier('E4B');
  const reasoningTag = getOllamaModelTagForTier('27B');

  useEffect(() => {
    setDraftUrl(settings.ollama.baseUrl);
  }, [settings.ollama.baseUrl]);

  useEffect(() => {
    setStatus({ kind: 'idle' });
  }, [effectiveBaseUrl, fastTag, fineTag, reasoningTag]);

  const saveOllamaUrl = useCallback(() => {
    setUrlError(null);
    const raw = draftUrl.trim();
    if (!raw) {
      dispatch({ type: 'SET_OLLAMA_BASE_URL', value: '' });
      return;
    }
    const normalized = normalizeOllamaBaseUrl(raw);
    if (!normalized) {
      setUrlError(
        'Enter a valid http(s) URL (for example http://192.168.1.10:11434) or leave blank to use this device.',
      );
      return;
    }
    dispatch({ type: 'SET_OLLAMA_BASE_URL', value: normalized });
  }, [dispatch, draftUrl]);

  const resetOllamaUrl = useCallback(() => {
    setUrlError(null);
    setDraftUrl('');
    dispatch({ type: 'SET_OLLAMA_BASE_URL', value: '' });
  }, [dispatch]);

  const testOllama = useCallback(async () => {
    setStatus({ kind: 'checking' });
    try {
      const tags = await probeOllama(effectiveBaseUrl);
      setStatus({ kind: 'ok', tags });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Ollama is not reachable.';
      setStatus({ kind: 'fail', message });
    }
  }, [effectiveBaseUrl]);

  const tiers: Array<['E2B' | 'E4B' | '27B', string, string]> = [
    ['E2B', TIER_LABELS.E2B, fastTag],
    ['E4B', TIER_LABELS.E4B, fineTag],
    ['27B', TIER_LABELS['27B'], reasoningTag],
  ];

  return (
    <SettingsStack className="text-sm">
      <SettingsSection
        title="Local Ollama"
        description="Patient interpretation, predictive phrases, bilingual coach, session insight, and the caregiver handover all run against your Ollama server at the URL below. Use another machine on your LAN, Docker, or Tailscale by entering its reachable http(s) address. No cloud LLM is contacted."
      >
        <SettingsControlCard className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text">
            <Cpu className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Ollama server URL
          </div>
          <label className="block text-[10px] font-medium text-muted" htmlFor="relay-ollama-url">
            Custom base URL (optional)
          </label>
          <input
            id="relay-ollama-url"
            type="url"
            inputMode="url"
            autoComplete="url"
            spellCheck={false}
            placeholder={DEFAULT_OLLAMA_BASE_URL}
            value={draftUrl}
            onChange={(e) => {
              setDraftUrl(e.target.value);
              setUrlError(null);
            }}
            className="control-input w-full font-mono text-[12px]"
          />
          {urlError ? (
            <p className="text-[11px] leading-snug text-[var(--danger)]" role="alert">
              {urlError}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <PillButton size="sm" variant="accent" type="button" onClick={saveOllamaUrl}>
              Save URL
            </PillButton>
            <PillButton size="sm" variant="glass" type="button" onClick={resetOllamaUrl}>
              Use default ({DEFAULT_OLLAMA_BASE_URL})
            </PillButton>
          </div>
          <div className="rounded-xl2 border border-black/[0.06] bg-black/[0.03] px-2.5 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              Effective endpoint
            </p>
            <p className="mt-0.5 break-all font-mono text-[11px] leading-snug text-text">
              {effectiveBaseUrl}
            </p>
            <p className="mt-1 text-[10px] leading-snug text-muted">
              {storedBase
                ? 'Relay sends every /api/generate and /api/tags request here. The browser must be allowed to reach this host (same device, LAN, or HTTPS with valid CORS).'
                : 'Blank uses the built-in default on this device. Save a URL to point Relay at Ollama on another host.'}
            </p>
          </div>
        </SettingsControlCard>

        {tiers.map(([tier, label, tag]) => {
          const overridden = readOllamaModelOverrideRaw(tier).trim().length > 0;
          return (
            <SettingsControlCard key={tier} className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text">
                <Cpu className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {label}
              </div>
              <p className="break-words font-mono text-[11px] leading-snug text-text">
                {tag}
              </p>
              <p className="text-[10px] leading-snug text-muted">
                {overridden
                  ? `Override stored locally; default is ${OLLAMA_MODEL_DEFAULT_TAG[tier]}.`
                  : 'Default tag — pull this image with `ollama pull` to enable this tier.'}
              </p>
            </SettingsControlCard>
          );
        })}
      </SettingsSection>

      <SettingsSection title="Connection test">
        <SettingsControlCard className="space-y-2">
          <p className="text-[10px] leading-snug text-muted">
            Pings <code className="rounded bg-black/5 px-1">/api/tags</code> on
            the saved effective endpoint and lists installed model tags. If you
            changed the URL field, tap Save URL first.
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
                {status.tags.length > 0
                  ? status.tags.join(', ')
                  : 'No models pulled yet — run `ollama pull <tag>`.'}
              </p>
            </div>
          ) : status.kind === 'fail' ? (
            <div className="rounded-xl2 border border-[var(--danger)]/30 bg-[var(--danger)]/[0.06] p-2 text-[11px] leading-snug text-[var(--danger)]">
              <p className="inline-flex items-center gap-1 font-semibold">
                <XCircle className="h-3.5 w-3.5" aria-hidden />
                Ollama not ready
              </p>
              <p className="mt-1 text-text">{status.message}</p>
              <p className="mt-1 text-[10px] text-muted">
                Make sure <code className="rounded bg-black/5 px-1">ollama serve</code>{' '}
                is running and that this browser can reach{' '}
                <code className="rounded bg-black/5 px-1">{effectiveBaseUrl}</code>.
              </p>
            </div>
          ) : null}
        </SettingsControlCard>
      </SettingsSection>
    </SettingsStack>
  );
}
