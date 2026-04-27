import { languageBase, sameLanguageFamily } from '@/lib/bilingualHero';

type ScriptBucket = 'latin' | 'hangul' | 'cjk' | 'arabic' | 'hebrew';

function expectedScriptForLocale(lang: string): ScriptBucket {
  const b = languageBase(lang);
  if (b === 'ko') return 'hangul';
  if (b === 'ja' || b === 'zh' || b === 'yue') return 'cjk';
  if (b.startsWith('ar') || b === 'fa' || b === 'ur') return 'arabic';
  if (b === 'he' || b === 'yi') return 'hebrew';
  return 'latin';
}

function localeScriptMatchesDom(loc: ScriptBucket, dom: ScriptBucket): boolean {
  if (loc === dom) return true;
  if (loc === 'cjk' && (dom === 'cjk' || dom === 'hangul')) return true;
  return false;
}

function scoreScripts(text: string): Record<ScriptBucket, number> {
  const out: Record<ScriptBucket, number> = {
    latin: 0,
    hangul: 0,
    cjk: 0,
    arabic: 0,
    hebrew: 0,
  };
  for (const ch of text) {
    if (/\p{Script=Latin}/u.test(ch)) out.latin++;
    else if (/\p{Script=Hangul}/u.test(ch)) out.hangul++;
    else if (
      /\p{Script=Han}/u.test(ch) ||
      /\p{Script=Hiragana}/u.test(ch) ||
      /\p{Script=Katakana}/u.test(ch)
    )
      out.cjk++;
    else if (/\p{Script=Arabic}/u.test(ch)) out.arabic++;
    else if (/\p{Script=Hebrew}/u.test(ch)) out.hebrew++;
  }
  return out;
}

function dominantBucket(scores: Record<ScriptBucket, number>): ScriptBucket | null {
  const entries = (Object.keys(scores) as ScriptBucket[]).map((k) => [k, scores[k]] as const);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total < 2) return null;
  entries.sort((a, b) => b[1] - a[1]);
  const [top, second] = entries;
  if (!top || top[1] < 2) return null;
  if (second && second[1] > 0 && top[1] / second[1] < 1.35) return null;
  return top[0];
}

/**
 * Best-effort guess of who spoke from raw transcript script vs configured
 * patient/caregiver locales. Undefined when both languages share the same
 * script expectation or the signal is weak (no reliable diarization in-browser).
 */
export function inferSpeakerFromTranscript(
  transcript: string,
  patientLang: string,
  caregiverLang: string,
): 'patient' | 'caregiver' | undefined {
  const t = transcript.trim();
  if (t.length < 2) return undefined;
  if (sameLanguageFamily(patientLang, caregiverLang)) return undefined;

  const pScript = expectedScriptForLocale(patientLang);
  const cScript = expectedScriptForLocale(caregiverLang);
  if (pScript === cScript) return undefined;

  const scores = scoreScripts(t);
  const dom = dominantBucket(scores);
  if (!dom) return undefined;

  const pHit = localeScriptMatchesDom(pScript, dom);
  const cHit = localeScriptMatchesDom(cScript, dom);
  if (pHit && !cHit) return 'patient';
  if (cHit && !pHit) return 'caregiver';
  return undefined;
}

export function inferSpeakerFromDetectedLanguage(
  detected: string,
  patientLang: string,
  caregiverLang: string,
): 'patient' | 'caregiver' | undefined {
  if (sameLanguageFamily(patientLang, caregiverLang)) return undefined;
  const mp = sameLanguageFamily(detected, patientLang);
  const mc = sameLanguageFamily(detected, caregiverLang);
  if (mp && !mc) return 'patient';
  if (mc && !mp) return 'caregiver';
  return undefined;
}

/** BCP-47 hint for the source utterance (STT locale + Gemma `language`). */
export function pickSourceLanguageHint(
  transcript: string,
  patientLang: string,
  caregiverLang: string,
  sessionLast: 'patient' | 'caregiver' | null,
): string {
  const role = inferSpeakerFromTranscript(transcript, patientLang, caregiverLang);
  if (role === 'caregiver') return caregiverLang;
  if (role === 'patient') return patientLang;
  if (sessionLast === 'caregiver') return caregiverLang;
  return patientLang;
}
