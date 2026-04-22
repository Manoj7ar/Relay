/**
 * Ollama API base URL — resolved from Settings (relay.settings) with a
 * localhost default. Used by GemmaInterpreterAdapter and connection checks.
 */

export const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434';

const SETTINGS_KEY = 'relay.settings';

/**
 * Trim, add http:// if no scheme, strip trailing slashes and hash.
 * Returns '' if the value is empty or not a valid http(s) URL.
 */
export function normalizeOllamaBaseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const withProto = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `http://${trimmed}`;
  try {
    const u = new URL(withProto);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
    u.hash = '';
    let path = u.pathname.replace(/\/+$/, '');
    if (path === '/') path = '';
    return `${u.origin}${path}`;
  } catch {
    return '';
  }
}

/** Empty or invalid stored value → default localhost. */
export function resolveOllamaBaseUrl(stored: string | undefined | null): string {
  const n = normalizeOllamaBaseUrl(String(stored ?? ''));
  return n || DEFAULT_OLLAMA_BASE_URL;
}

/** Read persisted Settings from localStorage (decoupled from React). */
export function getResolvedOllamaBaseUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_OLLAMA_BASE_URL;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_OLLAMA_BASE_URL;
    const parsed = JSON.parse(raw) as { ollama?: { baseUrl?: string } };
    return resolveOllamaBaseUrl(parsed?.ollama?.baseUrl ?? '');
  } catch {
    return DEFAULT_OLLAMA_BASE_URL;
  }
}
