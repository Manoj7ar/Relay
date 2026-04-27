/** Compare BCP-47 tags loosely (e.g. ko-KR vs ko). */
export function languageBase(code: string): string {
  const trimmed = code.trim().toLowerCase();
  const i = trimmed.indexOf('-');
  return i === -1 ? trimmed : trimmed.slice(0, i);
}

export function sameLanguageFamily(a: string, b: string): boolean {
  return languageBase(a) === languageBase(b);
}

export interface BilingualHeroInput {
  patientLanguageText: string;
  caregiverLanguageText: string;
  patientLang: string;
  caregiverLang: string;
  detectedLanguage: string;
  speakerRole: 'patient' | 'caregiver';
}

export interface BilingualHeroResult {
  primaryText: string;
  translation: string | undefined;
  ttsLang: string;
  ambiguous: boolean;
  patientLanguageText: string;
  caregiverLanguageText: string;
}

/**
 * Pick listener-facing hero text and TTS language from model output + language pair.
 * If detection is ambiguous, use speakerRole as a tie-breaker (inferred / session speaker).
 */
export function resolveBilingualHero(
  input: BilingualHeroInput,
): BilingualHeroResult {
  const patientLine = input.patientLanguageText.trim() || 'Message received.';
  const caregiverLine = input.caregiverLanguageText.trim() || patientLine;

  const patientLang = input.patientLang.trim() || 'en-US';
  const caregiverLang = input.caregiverLang.trim() || 'en-US';
  const detected = input.detectedLanguage.trim() || patientLang;

  if (sameLanguageFamily(patientLang, caregiverLang)) {
    return {
      primaryText: patientLine,
      translation: undefined,
      ttsLang: patientLang,
      ambiguous: false,
      patientLanguageText: patientLine,
      caregiverLanguageText: caregiverLine,
    };
  }

  const matchesPatient = sameLanguageFamily(detected, patientLang);
  const matchesCaregiver = sameLanguageFamily(detected, caregiverLang);
  const ambiguous = !matchesPatient && !matchesCaregiver;

  if (ambiguous) {
    if (input.speakerRole === 'caregiver') {
      return {
        primaryText: patientLine,
        translation: caregiverLine,
        ttsLang: patientLang,
        ambiguous: true,
        patientLanguageText: patientLine,
        caregiverLanguageText: caregiverLine,
      };
    }
    return {
      primaryText: caregiverLine,
      translation: patientLine,
      ttsLang: caregiverLang,
      ambiguous: true,
      patientLanguageText: patientLine,
      caregiverLanguageText: caregiverLine,
    };
  }

  if (matchesCaregiver) {
    return {
      primaryText: patientLine,
      translation: caregiverLine,
      ttsLang: patientLang,
      ambiguous: false,
      patientLanguageText: patientLine,
      caregiverLanguageText: caregiverLine,
    };
  }

  return {
    primaryText: caregiverLine,
    translation: patientLine,
    ttsLang: caregiverLang,
    ambiguous: false,
    patientLanguageText: patientLine,
    caregiverLanguageText: caregiverLine,
  };
}
