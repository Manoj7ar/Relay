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
  DEFAULT_PROFILE,
  DEFAULT_SETTINGS,
  type ProfileSettings,
  type SettingsState,
  type VoiceSampleRecord,
} from '@/types/settings';

type ProfileStringField =
  | 'displayName'
  | 'fullName'
  | 'pronouns'
  | 'condition'
  | 'conditionDetail'
  | 'caregiverName'
  | 'caregiverRelationship';

type Action =
  | { type: 'SET_RELAY_POWER_ON'; value: boolean }
  | { type: 'SET_HIGH_CONTRAST'; value: boolean }
  | { type: 'SET_LARGE_TEXT'; value: boolean }
  | { type: 'SET_LOW_POWER'; value: boolean }
  | { type: 'SET_PRIMARY_LANGUAGE'; value: string }
  | { type: 'SET_CAREGIVER_LANGUAGE'; value: string }
  | { type: 'SET_SETUP_ROLE'; value: ProfileSettings['setupRole'] }
  | { type: 'SET_PROFILE_FIELD'; field: ProfileStringField; value: string }
  | { type: 'SET_PERSONAL_PHRASES'; value: string[] }
  | { type: 'ADD_VOICE_SAMPLE'; value: VoiceSampleRecord }
  | { type: 'REMOVE_VOICE_SAMPLE'; id: string }
  | { type: 'CLEAR_VOICE_SAMPLES' }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'RESET_ONBOARDING' }
  | { type: 'SET_OLLAMA_BASE_URL'; value: string }
  | { type: 'SET_PERFORMANCE_HUD'; value: boolean }
  | { type: 'RESET' };

function reducer(state: SettingsState, action: Action): SettingsState {
  switch (action.type) {
    case 'SET_RELAY_POWER_ON':
      return { ...state, relayPowerOn: action.value };
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
    case 'SET_LOW_POWER':
      return {
        ...state,
        accessibility: { ...state.accessibility, lowPower: action.value },
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
    case 'SET_SETUP_ROLE':
      return {
        ...state,
        profile: { ...state.profile, setupRole: action.value },
      };
    case 'SET_PROFILE_FIELD': {
      if (action.field === 'condition') {
        return {
          ...state,
          profile: {
            ...state.profile,
            condition: action.value as ProfileSettings['condition'],
          },
        };
      }
      return {
        ...state,
        profile: { ...state.profile, [action.field]: action.value },
      };
    }
    case 'SET_PERSONAL_PHRASES':
      return {
        ...state,
        profile: { ...state.profile, personalPhrases: action.value },
      };
    case 'ADD_VOICE_SAMPLE': {
      const without = state.profile.voiceSamples.filter(
        (s) => s.id !== action.value.id,
      );
      return {
        ...state,
        profile: {
          ...state.profile,
          voiceSamples: [...without, action.value],
        },
      };
    }
    case 'REMOVE_VOICE_SAMPLE':
      return {
        ...state,
        profile: {
          ...state.profile,
          voiceSamples: state.profile.voiceSamples.filter(
            (s) => s.id !== action.id,
          ),
        },
      };
    case 'CLEAR_VOICE_SAMPLES':
      return {
        ...state,
        profile: { ...state.profile, voiceSamples: [] },
      };
    case 'COMPLETE_ONBOARDING':
      return {
        ...state,
        onboardingCompletedAt: Date.now(),
      };
    case 'RESET_ONBOARDING':
      return {
        ...state,
        onboardingCompletedAt: null,
      };
    case 'SET_OLLAMA_BASE_URL':
      return {
        ...state,
        ollama: { baseUrl: action.value.trim() },
      };
    case 'SET_PERFORMANCE_HUD':
      return {
        ...state,
        developer: {
          ...state.developer,
          performanceHud: action.value,
        },
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

function hydrate(fallback: SettingsState): SettingsState {
  const stored = load<Partial<SettingsState>>(STORAGE_KEY, fallback);
  return {
    ...fallback,
    relayPowerOn:
      typeof stored.relayPowerOn === 'boolean'
        ? stored.relayPowerOn
        : fallback.relayPowerOn,
    accessibility: {
      ...fallback.accessibility,
      ...(stored.accessibility ?? {}),
    },
    language: { ...fallback.language, ...(stored.language ?? {}) },
    ollama: {
      ...fallback.ollama,
      ...(stored.ollama ?? {}),
      baseUrl:
        typeof stored.ollama?.baseUrl === 'string'
          ? stored.ollama.baseUrl
          : fallback.ollama.baseUrl,
    },
    developer: {
      ...fallback.developer,
      ...(stored.developer ?? {}),
      performanceHud:
        typeof stored.developer?.performanceHud === 'boolean'
          ? stored.developer.performanceHud
          : fallback.developer.performanceHud,
    },
    profile: {
      ...DEFAULT_PROFILE,
      ...(stored.profile ?? {}),
      personalPhrases: Array.isArray(stored.profile?.personalPhrases)
        ? stored.profile.personalPhrases
        : DEFAULT_PROFILE.personalPhrases,
      voiceSamples: Array.isArray(stored.profile?.voiceSamples)
        ? stored.profile.voiceSamples
        : DEFAULT_PROFILE.voiceSamples,
    },
    onboardingCompletedAt:
      typeof stored.onboardingCompletedAt === 'number'
        ? stored.onboardingCompletedAt
        : null,
  } as SettingsState;
}

export function SettingsProvider({ children }: PropsWithChildren) {
  const [settings, dispatch] = useReducer(reducer, DEFAULT_SETTINGS, hydrate);

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
    if (settings.accessibility.lowPower) {
      root.setAttribute('data-low-power', 'true');
    } else {
      root.removeAttribute('data-low-power');
    }
  }, [
    settings.accessibility.highContrast,
    settings.accessibility.largeText,
    settings.accessibility.lowPower,
  ]);

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
