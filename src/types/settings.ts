export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
}

export interface LanguageSettings {
  primaryLanguage: string;
  caregiverLanguage: string;
}

/** Ollama HTTP API root (no trailing slash). Empty baseUrl → localhost default at resolve time. */
export interface OllamaSettings {
  baseUrl: string;
}

export type SetupRole = 'patient' | 'caregiver' | 'unknown';

export type ConditionId =
  | ''
  | 'als'
  | 'aphasia'
  | 'dysarthria'
  | 'parkinson'
  | 'other';

export interface VoiceSampleRecord {
  /** Stable id: "greeting" | "help" | "water" | "rest" (or custom). */
  id: string;
  /** Prompt shown to the user when captured (e.g. "I need help, please."). */
  prompt: string;
  /** What SpeechRecognition heard — used to teach Gemma the patient's patterns. */
  transcript: string;
  durationMs: number;
  recordedAt: number;
  /** IndexedDB key for the audio blob. */
  audioKey: string;
}

export interface ProfileSettings {
  setupRole: SetupRole;
  displayName: string;
  fullName: string;
  pronouns: string;
  condition: ConditionId;
  conditionDetail: string;
  caregiverName: string;
  caregiverRelationship: string;
  personalPhrases: string[];
  voiceSamples: VoiceSampleRecord[];
}

export interface SettingsState {
  /** When false, interpretation and patient inputs are suspended (master switch). */
  relayPowerOn: boolean;
  accessibility: AccessibilitySettings;
  language: LanguageSettings;
  ollama: OllamaSettings;
  profile: ProfileSettings;
  onboardingCompletedAt: number | null;
}

export const DEFAULT_PROFILE: ProfileSettings = {
  setupRole: 'unknown',
  displayName: '',
  fullName: '',
  pronouns: '',
  condition: '',
  conditionDetail: '',
  caregiverName: '',
  caregiverRelationship: '',
  personalPhrases: [],
  voiceSamples: [],
};

export const DEFAULT_SETTINGS: SettingsState = {
  relayPowerOn: true,
  accessibility: {
    highContrast: false,
    largeText: false,
  },
  language: {
    primaryLanguage: 'en-US',
    caregiverLanguage: 'en-US',
  },
  ollama: {
    baseUrl: '',
  },
  profile: DEFAULT_PROFILE,
  onboardingCompletedAt: null,
};
