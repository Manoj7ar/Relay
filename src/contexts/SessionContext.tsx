/**
 * Session state: interpretations, history, listening/processing.
 *
 * All "raw input → interpreted phrase" calls go through
 * `interpretationService.interpret`, which delegates to
 * `GemmaInterpreterAdapter`. Until Gemma is wired, interpret() throws
 * `GemmaNotConnectedError`; we surface that as `state.lastError` so the
 * UI can show an honest "not connected" state instead of a fake answer.
 *
 * See docs/ARCHITECTURE.md + docs/GEMMA_AND_INTEGRATIONS.md.
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
import {
  interpret as runInterpret,
  type InterpretationInput,
  type InterpretationResult,
} from '@/services/interpretationService';
import type { InferenceRequest, Interpretation, ModelId } from '@/types/model';
import type {
  InteractionRecord,
  PendingImageContext,
  SessionState,
} from '@/types/session';

type Action =
  | { type: 'START_LISTEN' }
  | { type: 'STOP_LISTEN' }
  | { type: 'SET_INTERIM'; text: string }
  | { type: 'START_PROCESSING' }
  | { type: 'SET_INTERPRETATION'; interpretation: Interpretation }
  | { type: 'APPLY_ALTERNATE'; alternate: string }
  | { type: 'TOGGLE_VISION' }
  | { type: 'SET_VISION'; value: boolean }
  | { type: 'SET_PENDING_IMAGE'; image: PendingImageContext | null }
  | { type: 'SET_LANGUAGE'; language: string; direction: 'ltr' | 'rtl' }
  | { type: 'CANCEL_CURRENT' }
  | { type: 'SET_ERROR'; message: string | null }
  | { type: 'PUSH_HISTORY'; record: InteractionRecord }
  | { type: 'UPDATE_HISTORY'; id: string; patch: Partial<InteractionRecord> }
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
  interimTranscript: '',
  pendingImage: null,
  lastError: null,
};

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'START_LISTEN':
      return {
        ...state,
        isListening: true,
        interimTranscript: '',
        lastError: null,
      };
    case 'STOP_LISTEN':
      return { ...state, isListening: false };
    case 'SET_INTERIM':
      return { ...state, interimTranscript: action.text };
    case 'START_PROCESSING':
      return {
        ...state,
        isProcessing: true,
        isListening: false,
        interimTranscript: '',
        lastError: null,
      };
    case 'SET_INTERPRETATION':
      return {
        ...state,
        isProcessing: false,
        currentInterpretation: action.interpretation,
        detectedLanguage: action.interpretation.detectedLanguage,
        direction: directionFor(action.interpretation.detectedLanguage),
        interimTranscript: '',
        lastError: null,
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
    case 'SET_VISION':
      return { ...state, visionOn: action.value };
    case 'SET_PENDING_IMAGE':
      return { ...state, pendingImage: action.image };
    case 'SET_LANGUAGE':
      return {
        ...state,
        detectedLanguage: action.language,
        direction: action.direction,
      };
    case 'CANCEL_CURRENT':
      return {
        ...state,
        currentInterpretation: null,
        isProcessing: false,
        interimTranscript: '',
      };
    case 'SET_ERROR':
      return { ...state, lastError: action.message, isProcessing: false };
    case 'PUSH_HISTORY':
      return { ...state, history: [action.record, ...state.history].slice(0, 100) };
    case 'UPDATE_HISTORY':
      return {
        ...state,
        history: state.history.map((h) =>
          h.id === action.id ? { ...h, ...action.patch } : h,
        ),
      };
    case 'CLEAR_HISTORY':
      return { ...state, history: [] };
    case 'HYDRATE_HISTORY':
      return { ...state, history: action.history };
  }
}

function resultToInterpretation(result: InterpretationResult): Interpretation {
  return {
    id: result.id,
    ts: result.ts,
    primary: result.primaryText,
    alternates: result.alternates,
    confidence: result.confidence,
    urgency: result.urgency,
    mood: result.mood,
    detectedLanguage: result.detectedLanguage,
    translation: result.translation,
    model: isModelId(result.sourceModel) ? result.sourceModel : 'E2B',
    latencyMs: result.latencyMs,
    inputType:
      result.sourceType === 'speech'
        ? result.visionUsed
          ? 'vision+speech'
          : 'speech'
        : result.sourceType === 'symbols'
          ? 'symbols'
          : 'text',
    visionUsed: result.visionUsed,
    sourceFragment: result.sourceFragment,
  };
}

function isModelId(value: string): value is ModelId {
  return value === 'E2B' || value === 'E4B' || value === '27B';
}

interface SessionContextValue {
  state: SessionState;
  dispatch: React.Dispatch<Action>;
  submit: (req: InferenceRequest) => Promise<InterpretationResult | null>;
  acceptAlternate: (alt: string) => void;
  applyActionTaken: (id: string, actionTaken: string, cancelled?: boolean) => void;
  setInterimTranscript: (text: string) => void;
  setPendingImage: (image: PendingImageContext | null) => void;
  clearCurrent: () => void;
  clearError: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, INITIAL, (init) => ({
    ...init,
    history: load<InteractionRecord[]>(STORAGE_KEY, []),
  }));
  const { recordInterpretation } = useModelRouting();

  useEffect(() => {
    save(STORAGE_KEY, state.history);
  }, [state.history]);

  const submit = useCallback(
    async (req: InferenceRequest): Promise<InterpretationResult | null> => {
      const visionOn = req.visionOn ?? state.visionOn;
      const input: InterpretationInput = {
        sourceType:
          req.inputType === 'symbols'
            ? 'symbols'
            : req.inputType === 'text'
              ? 'text'
              : 'speech',
        transcript: req.transcript,
        symbols: req.symbols,
        imageDataUrl: state.pendingImage?.dataUrl,
        language: req.language,
        urgencyHint: req.urgencyHint,
        onStreamChunk: (partial) => {
          dispatch({ type: 'SET_INTERIM', text: partial });
        },
      };

      dispatch({ type: 'START_PROCESSING' });
      try {
        const result = await runInterpret(input);
        if (visionOn || state.pendingImage) {
          result.visionUsed = true;
        }
        const interp = resultToInterpretation(result);
        if (visionOn) interp.visionUsed = true;
        const record: InteractionRecord = {
          ...interp,
          actionTaken: interp.actionTaken ?? 'Spoken only',
          rawTranscript: req.transcript ?? req.symbols?.join(' '),
          spoken: false,
          cameraUsed: Boolean(state.pendingImage),
          sourceType: input.sourceType,
        };
        dispatch({ type: 'SET_INTERPRETATION', interpretation: interp });
        dispatch({ type: 'PUSH_HISTORY', record });
        recordInterpretation(interp, result.routingReason);
        if (state.pendingImage) {
          dispatch({ type: 'SET_PENDING_IMAGE', image: null });
        }
        return result;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Interpretation failed. Please try again.';
        dispatch({ type: 'CANCEL_CURRENT' });
        dispatch({ type: 'SET_ERROR', message });
        if (import.meta.env?.DEV) {
          console.error('[interpretationService]', err);
        }
        return null;
      }
    },
    [state.visionOn, state.pendingImage, recordInterpretation],
  );

  const acceptAlternate = useCallback((alt: string) => {
    dispatch({ type: 'APPLY_ALTERNATE', alternate: alt });
  }, []);

  const applyActionTaken = useCallback(
    (id: string, actionTaken: string, cancelled?: boolean) => {
      dispatch({ type: 'UPDATE_HISTORY', id, patch: { actionTaken, cancelled } });
    },
    [],
  );

  const setInterimTranscript = useCallback((text: string) => {
    dispatch({ type: 'SET_INTERIM', text });
  }, []);

  const setPendingImage = useCallback((image: PendingImageContext | null) => {
    dispatch({ type: 'SET_PENDING_IMAGE', image });
  }, []);

  const clearCurrent = useCallback(() => {
    dispatch({ type: 'CANCEL_CURRENT' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', message: null });
  }, []);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      submit,
      acceptAlternate,
      applyActionTaken,
      setInterimTranscript,
      setPendingImage,
      clearCurrent,
      clearError,
    }),
    [
      state,
      submit,
      acceptAlternate,
      applyActionTaken,
      setInterimTranscript,
      setPendingImage,
      clearCurrent,
      clearError,
    ],
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
