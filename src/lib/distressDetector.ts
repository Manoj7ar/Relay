import type { InteractionRecord } from '@/types/session';

const WINDOW_MS = 5 * 60 * 1000;
const THRESHOLD = 2;

/**
 * Flags a distress pattern when the patient has produced 2+ non-cancelled
 * HIGH-urgency interpretations in the last 5 minutes. The caregiver view
 * surfaces a persistent alert so repeated emergencies are not missed.
 */
export function detectDistressPattern(history: InteractionRecord[]): boolean {
  const cutoff = Date.now() - WINDOW_MS;
  let count = 0;
  for (const record of history) {
    if (record.ts < cutoff) continue;
    if (record.urgency !== 'HIGH') continue;
    if (record.cancelled) continue;
    count += 1;
    if (count >= THRESHOLD) return true;
  }
  return false;
}
