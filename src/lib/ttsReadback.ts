import type { Interpretation } from '@/types/model';

/**
 * Text and BCP-47 tag for patient-home read-aloud: match the **listener** channel
 * to who spoke (`inferredSpeaker`), not the on-screen "primary" hero line.
 */
export function readbackTextAndLang(
  interpretation: Interpretation,
  primaryLanguage: string,
  caregiverLanguage: string,
): { text: string; lang: string } {
  const primaryLang = primaryLanguage.trim() || 'en-US';
  const caregiverLang = caregiverLanguage.trim() || 'en-US';
  const fallback = interpretation.primary.trim() || 'Message received.';
  const patientLine =
    interpretation.patientLanguageText?.trim() || fallback;
  const caregiverLine =
    interpretation.caregiverLanguageText?.trim() || fallback;

  if (interpretation.inferredSpeaker === 'caregiver') {
    return { text: caregiverLine, lang: caregiverLang };
  }

  return { text: patientLine, lang: primaryLang };
}
