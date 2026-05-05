/**
 * Text-to-speech via `window.speechSynthesis`.
 *
 * Handles the async `voiceschanged` event so the first call after boot
 * doesn't miss voices on Chrome/Android.
 *
 * Voice selection ranks OS-provided voices by name heuristics (Enhanced /
 * Premium / Neural, etc.) within each language tier. `default` and
 * `localService` are tie-breakers only — meaning varies by browser.
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

function scoreVoiceName(name: string): number {
  const n = name.toLowerCase();
  let s = 0;
  if (n.includes('premium')) s += 50;
  if (n.includes('enhanced')) s += 45;
  if (n.includes('neural')) s += 40;
  if (n.includes('wavenet')) s += 40;
  if (n.includes('natural')) s += 25;
  if (n.includes('compact')) s -= 20;
  if (/\btiny\b/.test(n)) s -= 15;
  return s;
}

function compareVoicesForQuality(
  a: SpeechSynthesisVoice,
  b: SpeechSynthesisVoice,
): number {
  const byName = scoreVoiceName(b.name) - scoreVoiceName(a.name);
  if (byName !== 0) return byName;
  if (a.default !== b.default) return a.default ? -1 : 1;
  if (a.localService !== b.localService) return a.localService ? -1 : 1;
  return a.name.localeCompare(b.name);
}

/** Same base BCP-47 language (e.g. en ↔ en-US). */
export function voiceLangCompatibleWith(
  voice: SpeechSynthesisVoice,
  utterLang: string | undefined,
): boolean {
  if (!utterLang?.trim()) return true;
  const v = voice.lang.toLowerCase();
  const t = utterLang.toLowerCase().trim();
  const vBase = v.split('-')[0];
  const tBase = t.split('-')[0];
  return (
    v === t ||
    v.startsWith(tBase + '-') ||
    t.startsWith(vBase + '-') ||
    vBase === tBase
  );
}

/**
 * Voices whose language matches any of the given tags (exact, regional, or
 * same base language) — for shortening the settings picker.
 */
export function filterVoicesForLanguageTags(
  voices: SpeechSynthesisVoice[],
  tags: string[],
): SpeechSynthesisVoice[] {
  const cleaned = tags.map((t) => t.trim()).filter(Boolean);
  if (!cleaned.length) return voices;
  return voices.filter((v) =>
    cleaned.some((lang) => voiceLangCompatibleWith(v, lang)),
  );
}

function pickFromPool(pool: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!pool.length) return null;
  return [...pool].sort(compareVoicesForQuality)[0] ?? null;
}

/**
 * Best voice for the utterance language: language tier (exact → regional →
 * base), then quality-ranked within the tier.
 */
export function pickVoiceForLang(
  voices: SpeechSynthesisVoice[],
  lang: string | undefined,
): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  if (!lang?.trim()) {
    const withDefault = voices.filter((v) => v.default);
    const pool = withDefault.length ? withDefault : voices;
    return pickFromPool(pool);
  }
  const normalized = lang.toLowerCase().trim();
  const base = normalized.split('-')[0];

  const exact = voices.filter((v) => v.lang.toLowerCase() === normalized);
  const fromExact = pickFromPool(exact);
  if (fromExact) return fromExact;

  const regional = voices.filter((v) =>
    v.lang.toLowerCase().startsWith(base + '-'),
  );
  const fromRegional = pickFromPool(regional);
  if (fromRegional) return fromRegional;

  const baseOnly = voices.filter((v) => v.lang.toLowerCase() === base);
  const fromBase = pickFromPool(baseOnly);
  if (fromBase) return fromBase;

  const withDefault = voices.filter((v) => v.default);
  const fallbackPool = withDefault.length ? withDefault : voices;
  return pickFromPool(fallbackPool);
}

/** Same as {@link pickVoiceForLang} (ranked). Kept for any legacy imports. */
export const matchVoiceForLang = pickVoiceForLang;

export interface SpeakOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  /** When set and compatible with `lang`, this OS voice is used. */
  voiceURI?: string | null;
  onEnd?: () => void;
  onError?: (ev: SpeechSynthesisErrorEvent) => void;
}

function resolveVoiceForSpeak(
  voices: SpeechSynthesisVoice[],
  utterLang: string | undefined,
  preferredVoiceURI: string | null | undefined,
): SpeechSynthesisVoice | null {
  if (preferredVoiceURI) {
    const chosen = voices.find((v) => v.voiceURI === preferredVoiceURI);
    if (
      chosen &&
      voiceLangCompatibleWith(chosen, utterLang ?? chosen.lang)
    ) {
      return chosen;
    }
  }
  return pickVoiceForLang(voices, utterLang);
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
  const utterLang = opts.lang ?? utter.lang;
  const match = resolveVoiceForSpeak(
    voices,
    utterLang || undefined,
    opts.voiceURI,
  );
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
