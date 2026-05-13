/**
 * Tap-to-speak transcription path.
 *
 * Relay never sends audio to a hosted service. The browser Web Speech API is
 * the primary STT path; when it returns nothing useful (blocked, offline, no
 * network), this helper posts the recorded audio blob to the optional local
 * STT sidecar configured via `VITE_RELAY_LOCAL_STT_URL` (reference server:
 * `scripts/local-stt-server.mjs`).
 *
 * If neither path produces text, returns an empty string so callers can fall
 * back to the "type instead" UI without throwing.
 */

import {
  isLocalSttConfigured,
  transcribeWithLocalStt,
} from '@/services/localSttService';

/**
 * Tap-to-speak: try the local STT sidecar (if configured) and fall back to
 * empty string. Web Speech API is handled separately in the speech hooks; this
 * runs only when the recorded blob is what we have.
 */
export async function transcribeTapToSpeak(
  audio: Blob,
  languageBcp47: string,
): Promise<string> {
  if (isLocalSttConfigured()) {
    try {
      const text = await transcribeWithLocalStt(audio, languageBcp47);
      if (text) return text;
    } catch {
      // Sidecar unreachable or returned non-2xx; fall through to empty.
    }
  }
  return '';
}
