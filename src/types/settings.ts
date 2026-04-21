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

export interface SettingsState {
  accessibility: AccessibilitySettings;
  integrations: IntegrationsSettings;
  language: LanguageSettings;
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
};
