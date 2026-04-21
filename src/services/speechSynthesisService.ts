/**
 * Text-to-speech via `window.speechSynthesis`.
 *
 * Handles the async `voiceschanged` event so the first call after boot
 * doesn't miss voices on Chrome/Android.
 */

export type SynthesisStatus = 'idle' | 'speaking' | 'paused' | 'unsupported';

export interface SynthesisStateSnapshot {
  status: SynthesisStatus;
  currentText: string | null;
  currentLang: string | null;
}

export function isSpeechSynthesisSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.speechSynthesis !== 'undefined'
  );
}

let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;

export function getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!isSpeechSynthesisSupported()) return Promise.resolve([]);
  if (voicesPromise) return voicesPromise;
  voicesPromise = new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const existing = synth.getVoices();
    if (existing && existing.length) {
      resolve(existing);
      return;
    }
    const onChange = () => {
      synth.removeEventListener('voiceschanged', onChange);
      resolve(synth.getVoices());
    };
    synth.addEventListener('voiceschanged', onChange);
    // Some browsers never fire the event; give them a nudge.
    setTimeout(() => {
      const later = synth.getVoices();
      if (later && later.length) {
        synth.removeEventListener('voiceschanged', onChange);
        resolve(later);
      }
    }, 500);
  });
  return voicesPromise;
}

export function matchVoiceForLang(
  voices: SpeechSynthesisVoice[],
  lang: string | undefined,
): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  if (!lang) {
    return voices.find((v) => v.default) ?? voices[0] ?? null;
  }
  const normalized = lang.toLowerCase();
  const base = normalized.split('-')[0];
  return (
    voices.find((v) => v.lang.toLowerCase() === normalized) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(base + '-')) ??
    voices.find((v) => v.lang.toLowerCase() === base) ??
    voices.find((v) => v.default) ??
    voices[0] ??
    null
  );
}

export interface SpeakOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  onEnd?: () => void;
  onError?: (ev: SpeechSynthesisErrorEvent) => void;
}

/**
 * Speak the given text using the closest voice match for the language.
 *
 * Returns the `SpeechSynthesisUtterance` so callers can track events if they
 * need finer control. Any in-flight speech is cancelled first.
 */
export async function speak(
  text: string,
  opts: SpeakOptions = {},
): Promise<SpeechSynthesisUtterance | null> {
  if (!isSpeechSynthesisSupported()) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;

  const synth = window.speechSynthesis;
  synth.cancel();

  const utter = new SpeechSynthesisUtterance(trimmed);
  if (opts.lang) utter.lang = opts.lang;
  utter.rate = opts.rate ?? 1;
  utter.pitch = opts.pitch ?? 1;
  utter.volume = opts.volume ?? 1;

  const voices = await getAvailableVoices();
  const match = matchVoiceForLang(voices, opts.lang ?? utter.lang);
  if (match) utter.voice = match;

  if (opts.onEnd) {
    utter.addEventListener('end', opts.onEnd, { once: true });
  }
  if (opts.onError) {
    utter.addEventListener('error', opts.onError, { once: true });
  }

  synth.speak(utter);
  return utter;
}

export function cancelSpeaking(): void {
  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.cancel();
}

export function pauseSpeaking(): void {
  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.pause();
}

export function resumeSpeaking(): void {
  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.resume();
}

export function isSpeaking(): boolean {
  if (!isSpeechSynthesisSupported()) return false;
  return window.speechSynthesis.speaking;
}
