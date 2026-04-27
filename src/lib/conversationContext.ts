import type { InteractionRecord } from '@/types/session';

/**
 * Compact tail of recent turns for Gemma (newest first in `history` order).
 */
export function formatConversationTailForPrompt(
  history: InteractionRecord[],
  maxLines = 5,
): string {
  const lines: string[] = [];
  const n = Math.min(maxLines, history.length);
  for (let i = 0; i < n; i++) {
    const h = history[i];
    const tag =
      h.inferredSpeaker === 'caregiver'
        ? 'caregiver'
        : h.inferredSpeaker === 'patient'
          ? 'patient'
          : 'unknown';
    const src = (h.rawTranscript ?? h.sourceFragment ?? '').trim().slice(0, 120);
    const hero = (h.primary ?? '').trim().slice(0, 200);
    lines.push(`- [${tag}] source: "${src}" → listener line: "${hero}"`);
  }
  if (lines.length === 0) return '';
  return `Recent exchanges (newest first):\n${lines.join('\n')}\n`;
}
