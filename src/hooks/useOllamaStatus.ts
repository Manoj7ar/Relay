import { useCallback, useEffect, useState } from 'react';
import { resolveOllamaBaseUrl } from '@/lib/ollamaUrl';

export type OllamaStatus = 'checking' | 'running' | 'unreachable';

/**
 * Polls the configured Ollama server (`/api/tags`) to show whether inference
 * is reachable. Base URL comes from Settings → Models (defaults to localhost).
 */
export function useOllamaStatus(
  storedBaseUrl: string | undefined,
  pollIntervalMs = 15_000,
): OllamaStatus {
  const [status, setStatus] = useState<OllamaStatus>('checking');
  const base = resolveOllamaBaseUrl(storedBaseUrl ?? '');

  const check = useCallback(async () => {
    try {
      const res = await fetch(`${base}/api/tags`, {
        signal: AbortSignal.timeout(4000),
      });
      setStatus(res.ok ? 'running' : 'unreachable');
    } catch {
      setStatus('unreachable');
    }
  }, [base]);

  useEffect(() => {
    void check();
    const interval = setInterval(() => {
      void check();
    }, pollIntervalMs);
    return () => clearInterval(interval);
  }, [check, pollIntervalMs]);

  return status;
}
