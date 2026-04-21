/**
 * Session state: interpretations, history, listening/processing.
 *
 * Layer: state. Orchestrates inference via `modelRouter` and persists history.
 * See docs/ARCHITECTURE.md
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type PropsWithChildren,
} from 'react';
import { load, save } from '@/lib/storage';
import { directionFor } from '@/hooks/useRTL';
import { useModelRouting } from './ModelRoutingContext';
import { useFineTuning } from './FineTuningContext';
import { useSettings } from './SettingsContext';
import {
  chooseModel,
  runInference,
} from '@/services/modelRouter';
import type {
  InferenceRequest,
  Interpretation,
} from '@/types/model';
import type {
  InteractionRecord,
  SessionState,
} from '@/types/session';

type Action =
  | { type: 'START_LISTEN' }
  | { type: 'STOP_LISTEN' }
  | { type: 'START_PROCESSING' }
  | { type: 'SET_INTERPRETATION'; interpretation: Interpretation }
  | { type: 'APPLY_ALTERNATE'; alternate: string }
  | { type: 'TOGGLE_VISION' }
  | { type: 'SET_LANGUAGE'; language: string; direction: 'ltr' | 'rtl' }
  | { type: 'CANCEL_CURRENT' }
  | { type: 'PUSH_HISTORY'; record: InteractionRecord }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'HYDRATE_HISTORY'; history: InteractionRecord[] };

const STORAGE_KEY = 'relay.session.history';
const INITIAL: SessionState = {
  isListening: false,
  isProcessing: false,
  currentInterpretation: null,
  history: [],
  visionOn: false,
  detectedLanguage: 'en-US',
  direction: 'ltr',
};

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'START_LISTEN':
      return { ...state, isListening: true };
    case 'STOP_LISTEN':
      return { ...state, isListening: false };
    case 'START_PROCESSING':
      return { ...state, isProcessing: true, isListening: false };
    case 'SET_INTERPRETATION':
      return {
        ...state,
        isProcessing: false,
        currentInterpretation: action.interpretation,
        detectedLanguage: action.interpretation.detectedLanguage,
        direction: directionFor(action.interpretation.detectedLanguage),
      };
    case 'APPLY_ALTERNATE':
      if (!state.currentInterpretation) return state;
      return {
        ...state,
        currentInterpretation: {
          ...state.currentInterpretation,
          alternates: [
            state.currentInterpretation.primary,
            ...state.currentInterpretation.alternates.filter(
              (a) => a !== action.alternate,
            ),
          ].slice(0, 2),
          primary: action.alternate,
        },
      };
    case 'TOGGLE_VISION':
      return { ...state, visionOn: !state.visionOn };
    case 'SET_LANGUAGE':
      return {
        ...state,
        detectedLanguage: action.language,
        direction: action.direction,
      };
    case 'CANCEL_CURRENT':
      return { ...state, currentInterpretation: null, isProcessing: false };
    case 'PUSH_HISTORY':
      return { ...state, history: [action.record, ...state.history].slice(0, 100) };
    case 'CLEAR_HISTORY':
      return { ...state, history: [] };
    case 'HYDRATE_HISTORY':
      return { ...state, history: action.history };
  }
}

interface SessionContextValue {
  state: SessionState;
  dispatch: React.Dispatch<Action>;
  submit: (req: InferenceRequest) => Promise<void>;
  acceptAlternate: (alt: string) => void;
  applyActionTaken: (id: string, actionTaken: string, cancelled?: boolean) => void;
  setInterpretation: (interpretation: Interpretation, reason: string) => void;
  clearCurrent: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, INITIAL, (init) => ({
    ...init,
    history: load<InteractionRecord[]>(STORAGE_KEY, []),
  }));
  const { settings } = useSettings();
  const { recordInterpretation } = useModelRouting();
  const { logInteraction } = useFineTuning();

  useEffect(() => {
    save(STORAGE_KEY, state.history);
  }, [state.history]);

  const setInterpretation = useCallback(
    (interp: Interpretation, reason: string) => {
      dispatch({ type: 'SET_INTERPRETATION', interpretation: interp });
      const record: InteractionRecord = {
        ...interp,
        actionTaken: interp.actionTaken ?? 'Spoken only',
      };
      dispatch({ type: 'PUSH_HISTORY', record });
      recordInterpretation(interp, reason);
      logInteraction();
    },
    [recordInterpretation, logInteraction],
  );

  const submit = useCallback(
    async (req: InferenceRequest) => {
      if (
        settings.demoMode &&
        (req.inputType === 'speech' || req.inputType === 'vision+speech')
      ) {
        dispatch({ type: 'STOP_LISTEN' });
        return;
      }
      dispatch({ type: 'START_PROCESSING' });
      const visionOn = req.visionOn ?? state.visionOn;
      const decision = chooseModel({ ...req, visionOn });
      const interp = await runInference({ ...req, visionOn });
      setInterpretation(interp, decision.reason);
    },
    [state.visionOn, setInterpretation, settings.demoMode],
  );

  const acceptAlternate = useCallback((alt: string) => {
    dispatch({ type: 'APPLY_ALTERNATE', alternate: alt });
  }, []);

  const applyActionTaken = useCallback(
    (id: string, actionTaken: string, cancelled?: boolean) => {
      // Update history mutably: PUSH_HISTORY keeps the record — but here we
      // need to patch the most recent. We rehydrate via HYDRATE_HISTORY.
      const history = state.history.map((h) =>
        h.id === id ? { ...h, actionTaken, cancelled } : h,
      );
      dispatch({ type: 'HYDRATE_HISTORY', history });
    },
    [state.history],
  );

  const clearCurrent = useCallback(() => {
    dispatch({ type: 'CANCEL_CURRENT' });
  }, []);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      submit,
      acceptAlternate,
      applyActionTaken,
      setInterpretation,
      clearCurrent,
    }),
    [state, submit, acceptAlternate, applyActionTaken, setInterpretation, clearCurrent],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
