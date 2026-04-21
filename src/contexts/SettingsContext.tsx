import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type PropsWithChildren,
} from 'react';
import { load, save } from '@/lib/storage';
import {
  DEFAULT_SETTINGS,
  type SettingsState,
  type VoiceBankingState,
} from '@/types/settings';

type Action =
  | { type: 'SET_HIGH_CONTRAST'; value: boolean }
  | { type: 'SET_LARGE_TEXT'; value: boolean }
  | { type: 'SET_SMARTTHINGS_ENABLED'; value: boolean }
  | { type: 'SET_SMARTTHINGS_APIKEY'; value: string }
  | { type: 'SET_SMARTTHINGS_HUB'; value: string }
  | { type: 'SET_CAREGIVER_PHONE'; value: string }
  | { type: 'SET_PRIMARY_LANGUAGE'; value: string }
  | { type: 'SET_CAREGIVER_LANGUAGE'; value: string }
  | { type: 'SET_DEMO_MODE'; value: boolean }
  | { type: 'VOICE_BANKING'; patch: Partial<VoiceBankingState> }
  | { type: 'RESET' };

function reducer(state: SettingsState, action: Action): SettingsState {
  switch (action.type) {
    case 'SET_HIGH_CONTRAST':
      return {
        ...state,
        accessibility: { ...state.accessibility, highContrast: action.value },
      };
    case 'SET_LARGE_TEXT':
      return {
        ...state,
        accessibility: { ...state.accessibility, largeText: action.value },
      };
    case 'SET_SMARTTHINGS_ENABLED':
      return {
        ...state,
        integrations: {
          ...state.integrations,
          smartThings: {
            ...state.integrations.smartThings,
            enabled: action.value,
          },
        },
      };
    case 'SET_SMARTTHINGS_APIKEY':
      return {
        ...state,
        integrations: {
          ...state.integrations,
          smartThings: {
            ...state.integrations.smartThings,
            apiKey: action.value,
          },
        },
      };
    case 'SET_SMARTTHINGS_HUB':
      return {
        ...state,
        integrations: {
          ...state.integrations,
          smartThings: {
            ...state.integrations.smartThings,
            hubName: action.value,
          },
        },
      };
    case 'SET_CAREGIVER_PHONE':
      return {
        ...state,
        integrations: {
          ...state.integrations,
          twilio: { caregiverPhone: action.value },
        },
      };
    case 'SET_PRIMARY_LANGUAGE':
      return {
        ...state,
        language: { ...state.language, primaryLanguage: action.value },
      };
    case 'SET_CAREGIVER_LANGUAGE':
      return {
        ...state,
        language: { ...state.language, caregiverLanguage: action.value },
      };
    case 'SET_DEMO_MODE':
      return { ...state, demoMode: action.value };
    case 'VOICE_BANKING':
      return {
        ...state,
        voiceBanking: { ...state.voiceBanking, ...action.patch },
      };
    case 'RESET':
      return DEFAULT_SETTINGS;
  }
}

interface SettingsContextValue {
  settings: SettingsState;
  dispatch: React.Dispatch<Action>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

const STORAGE_KEY = 'relay.settings';

export function SettingsProvider({ children }: PropsWithChildren) {
  const [settings, dispatch] = useReducer(reducer, DEFAULT_SETTINGS, (fallback) =>
    load<SettingsState>(STORAGE_KEY, fallback),
  );

  useEffect(() => {
    save(STORAGE_KEY, settings);
  }, [settings]);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.accessibility.highContrast) {
      root.setAttribute('data-contrast', 'high');
    } else {
      root.removeAttribute('data-contrast');
    }
    root.style.setProperty(
      '--font-scale',
      settings.accessibility.largeText ? '1.18' : '1',
    );
  }, [settings.accessibility.highContrast, settings.accessibility.largeText]);

  const value = useMemo(() => ({ settings, dispatch }), [settings]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
