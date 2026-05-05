import type { ModelId } from '@/types/model';

type OllamaTier = Exclude<ModelId, 'OLLAMA'>;

/** localStorage keys for optional per-tier Ollama image tags. */
export const OLLAMA_MODEL_STORAGE_KEY: Record<OllamaTier, string> = {
  E2B: 'relay.model.fast',
  E4B: 'relay.model.finetuned',
  '27B': 'relay.model.quality',
};

/** Default tags when no override is stored (must match `ollama pull` names). */
export const OLLAMA_MODEL_DEFAULT_TAG: Record<OllamaTier, string> = {
  E2B: 'gemma4:e2b',
  E4B: 'gemma4:e4b',
  '27B': 'gemma4:27b',
};

const TIERS: OllamaTier[] = ['E2B', 'E4B', '27B'];

/** Raw value in localStorage (may be empty). SSR-safe. */
export function readOllamaModelOverrideRaw(tier: OllamaTier): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(OLLAMA_MODEL_STORAGE_KEY[tier]) ?? '';
  } catch {
    return '';
  }
}

/** Resolved tag for API calls — blank storage uses the default tag. */
export function getOllamaModelTagForTier(tier: OllamaTier): string {
  const trimmed = readOllamaModelOverrideRaw(tier).trim();
  return trimmed.length > 0 ? trimmed : OLLAMA_MODEL_DEFAULT_TAG[tier];
}

export function writeOllamaModelOverride(tier: OllamaTier, value: string): void {
  if (typeof window === 'undefined') return;
  const key = OLLAMA_MODEL_STORAGE_KEY[tier];
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

export function clearAllOllamaModelOverrides(): void {
  for (const tier of TIERS) {
    writeOllamaModelOverride(tier, '');
  }
}

/** True if any tier has a non-empty stored override. */
export function hasOllamaModelOverrideStored(): boolean {
  return TIERS.some((tier) => readOllamaModelOverrideRaw(tier).trim().length > 0);
}
