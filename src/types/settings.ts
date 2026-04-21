export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
}

export interface IntegrationsSettings {
  smartThings: {
    enabled: boolean;
    apiKey: string;
    hubName: string;
  };
  twilio: {
    caregiverPhone: string;
  };
}

export interface LanguageSettings {
  primaryLanguage: string;
  caregiverLanguage: string;
}

export interface VoiceBankingState {
  currentStep: 0 | 1 | 2 | 3;
  recordedPhrases: number;
  cloneReady: boolean;
}

export type InterpreterModeSetting = 'browser' | 'mock' | 'gemma';

export interface DevModeSettings {
  /** Which interpreter adapter to use when hardware inputs arrive. */
  interpreter: InterpreterModeSetting;
}

export interface SettingsState {
  accessibility: AccessibilitySettings;
  integrations: IntegrationsSettings;
  language: LanguageSettings;
  voiceBanking: VoiceBankingState;
  demoMode: boolean;
  devMode: DevModeSettings;
}

export const DEFAULT_SETTINGS: SettingsState = {
  accessibility: {
    highContrast: false,
    largeText: false,
  },
  integrations: {
    smartThings: {
      enabled: false,
      apiKey: '',
      hubName: 'Home',
    },
    twilio: {
      caregiverPhone: '',
    },
  },
  language: {
    primaryLanguage: 'en-US',
    caregiverLanguage: 'en-US',
  },
  voiceBanking: {
    currentStep: 0,
    recordedPhrases: 0,
    cloneReady: false,
  },
  demoMode: false,
  devMode: {
    interpreter: 'browser',
  },
};
