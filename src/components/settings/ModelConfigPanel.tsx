import { useEffect, useState } from 'react';
import { CheckCircle2, Cpu, Loader2, XCircle } from 'lucide-react';
import { Card, PillButton } from '@/components/primitives';
import { useSettings } from '@/contexts/SettingsContext';
import {
  DEFAULT_OLLAMA_BASE_URL,
  resolveOllamaBaseUrl,
} from '@/lib/ollamaUrl';

const MODEL_KEYS = {
  fast: 'relay.model.fast',
  finetuned: 'relay.model.finetuned',
  quality: 'relay.model.quality',
} as const;

const DEFAULTS = {
  fast: 'gemma4:e2b',
  finetuned: 'gemma4:e4b',
  quality: 'gemma4:27b',
} as const;

interface FieldSpec {
  key: keyof typeof MODEL_KEYS;
  label: string;
  tier: 'E2B' | 'E4B' | '27B';
  description: string;
}

const FIELDS: FieldSpec[] = [
  {
    key: 'fast',
    label: 'Fast model (E2B tier)',
    tier: 'E2B',
    description:
      'Used for real-time speech shortcuts, under ~2s latency.',
  },
  {
    key: 'finetuned',
    label: 'Fine-tuned model (E4B tier)',
    tier: 'E4B',
    description:
      'Used for symbol-board expansion and personalized phrase reconstruction.',
  },
  {
    key: 'quality',
    label: 'Quality model (27B tier)',
    tier: '27B',
    description:
      'Used for multimodal reasoning (camera + speech) and HIGH-urgency utterances.',
  },
];

type TestStatus =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'ok'; models: string[] }
  | { kind: 'fail'; message: string };

function readStored(key: string): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

function writeStored(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (value.trim().length === 0) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value.trim());
    }
  } catch {
    // ignore
  }
}

export function ModelConfigPanel() {
  const { settings, dispatch } = useSettings();
  const [values, setValues] = useState<Record<keyof typeof MODEL_KEYS, string>>(
    { fast: '', finetuned: '', quality: '' },
  );
  const [status, setStatus] = useState<TestStatus>({ kind: 'idle' });

  useEffect(() => {
    setValues({
      fast: readStored(MODEL_KEYS.fast),
      finetuned: readStored(MODEL_KEYS.finetuned),
      quality: readStored(MODEL_KEYS.quality),
    });
  }, []);

  const updateField = (key: keyof typeof MODEL_KEYS, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    writeStored(MODEL_KEYS[key], value);
  };

  const effectiveBase = resolveOllamaBaseUrl(settings.ollama.baseUrl);

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

  return (
    <Card padded={false} className="h-full min-h-0 space-y-3 overflow-y-auto p-3 text-sm">
      <div className="flex items-center justify-between">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold">
          <Cpu className="h-3.5 w-3.5" aria-hidden />
          Model configuration
        </p>
      </div>

      <p className="text-[11px] leading-snug text-muted">
        Set your Ollama API base URL (another computer, home server, or HTTPS
        tunnel). Leave blank to use{' '}
        <code className="rounded bg-black/5 px-1">{DEFAULT_OLLAMA_BASE_URL}</code>
        . Model names must match tags on that server (
        <code className="rounded bg-black/5 px-1">ollama list</code>). Hosted
        apps need <span className="font-medium text-text">HTTPS</span> on the
        Ollama side and{' '}
        <span className="font-medium text-text">CORS</span> allowing this
        origin.
      </p>

      <label className="block text-xs">
        <span className="mb-1 block font-medium">Ollama base URL</span>
        <input
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="https://ollama.example.com or http://192.168.1.10:11434"
          value={settings.ollama.baseUrl}
          onChange={(e) =>
            dispatch({ type: 'SET_OLLAMA_BASE_URL', value: e.target.value })
          }
          className="control-input font-mono text-sm"
        />
        <p className="mt-1 text-[10px] leading-snug text-muted">
          Using:{' '}
          <span className="break-all font-mono text-text">{effectiveBase}</span>
        </p>
      </label>

      {FIELDS.map((field) => (
        <div key={field.key} className="space-y-1">
          <label className="block text-xs">
            <span className="mb-1 block font-medium">{field.label}</span>
            <input
              type="text"
              value={values[field.key]}
              onChange={(e) => updateField(field.key, e.target.value)}
              placeholder={DEFAULTS[field.key]}
              spellCheck={false}
              className="control-input font-mono text-sm"
            />
          </label>
          <p className="text-[10px] leading-snug text-muted">
            {field.description}
          </p>
          <p className="text-[10px] text-muted">
            Current:{' '}
            <span className="font-mono">
              {values[field.key] || DEFAULTS[field.key]}
            </span>
          </p>
        </div>
      ))}

      <div className="space-y-1.5 border-t border-black/5 pt-2">
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
          {status.kind === 'checking' ? 'Checking…' : 'Test Ollama connection'}
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
      </div>
    </Card>
  );
}
