import { useCallback, useEffect, useState } from 'react';

export type OllamaStatus = 'checking' | 'running' | 'unreachable';

/**
 * Polls the local Ollama server to surface whether the AI engine is reachable.
 * `navigator.onLine` alone is insufficient — a user can be online while Ollama
 * is not running. That is a different failure mode worth reporting distinctly.
 */
export function useOllamaStatus(pollIntervalMs = 15_000): OllamaStatus {
  const [status, setStatus] = useState<OllamaStatus>('checking');

  const check = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:11434/api/tags', {
        signal: AbortSignal.timeout(2000),
      });
      setStatus(res.ok ? 'running' : 'unreachable');
    } catch {
      setStatus('unreachable');
    }
  }, []);

  useEffect(() => {
    void check();
    const interval = setInterval(() => {
      void check();
    }, pollIntervalMs);
    return () => clearInterval(interval);
  }, [check, pollIntervalMs]);

  return status;
}
