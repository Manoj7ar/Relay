/**
 * Session state: interpretations, history, listening/processing.
 *
 * All "raw input → interpreted phrase" calls go through
 * `interpretationService.interpret` (Ollama). When the
 * provider is unreachable, interpret() throws the provider error; we surface
 * `state.lastError` (title + hint +
 * optional technical) so the
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
  useRef,
  type PropsWithChildren,
} from 'react';
import { load, save } from '@/lib/storage';
import { formatConversationTailForPrompt } from '@/lib/conversationContext';
import { directionFor } from '@/hooks/useRTL';
import { useSettings } from '@/contexts/SettingsContext';
import {
  normalizeDetectedToSupportedLocale,
  shouldAutoAdaptFromInterpretation,
} from '@/lib/languageAdaptation';
import { sameLanguageFamily } from '@/lib/bilingualHero';
import { useModelRouting } from './ModelRoutingContext';
import {
  interpret as runInterpret,
  type InterpretationInput,
  type InterpretationResult,
} from '@/services/interpretationService';
import type { InferenceRequest, Interpretation, ModelId } from '@/types/model';
import type {
  InteractionRecord,
  LastInputSnapshot,
  PendingImageContext,
  SessionState,
} from '@/types/session';
import type { SessionInterpretationError } from '@/types/interpretationError';
import { sessionErrorFromUnknown } from '@/lib/sessionInterpretationError';
import { decrementConfirmation } from '@/lib/patientDictionary';

type Action =
  | { type: 'SUSPEND_RELAY' }
  | { type: 'SET_SESSION_INFERRED_SPEAKER'; role: 'patient' | 'caregiver' }
  | { type: 'START_LISTEN' }
  | { type: 'STOP_LISTEN' }
  | { type: 'SET_INTERIM'; text: string }
  | { type: 'START_PROCESSING' }
  | { type: 'SET_INTERPRETATION'; interpretation: Interpretation }
  | { type: 'APPLY_ALTERNATE'; alternate: string }
  | { type: 'TOGGLE_VISION' }
  | { type: 'SET_VISION'; value: boolean }
  | { type: 'SET_PENDING_IMAGE'; image: PendingImageContext | null }
  | { type: 'SET_LAST_INPUT'; input: LastInputSnapshot | null }
  | { type: 'SET_LANGUAGE'; language: string; direction: 'ltr' | 'rtl' }
  | { type: 'CANCEL_CURRENT' }
  | { type: 'SET_ERROR'; error: SessionInterpretationError | null }
  | { type: 'PUSH_HISTORY'; record: InteractionRecord }
  | { type: 'UPDATE_HISTORY'; id: string; patch: Partial<InteractionRecord> }
  | { type: 'REMOVE_HISTORY_RECORD'; id: string }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'HYDRATE_HISTORY'; history: InteractionRecord[] };

const STORAGE_KEY = 'relay.session.history';
const INITIAL: SessionState = {
  isListening: false,
  isProcessing: false,
  currentInterpretation: null,
  history: [],
  visionOn: false,
  sessionInferredSpeaker: null,
  detectedLanguage: 'en-US',
  direction: 'ltr',
  interimTranscript: '',
  pendingImage: null,
  lastInputSnapshot: null,
  lastError: null,
  lastCloudAiSuccessAt: null,
  requestStartedAt: null,
};

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'SUSPEND_RELAY':
      return {
        ...state,
        isListening: false,
        isProcessing: false,
        interimTranscript: '',
        pendingImage: null,
        sessionInferredSpeaker: null,
        requestStartedAt: null,
      };
    case 'SET_SESSION_INFERRED_SPEAKER':
      return { ...state, sessionInferredSpeaker: action.role };
    case 'START_LISTEN':
      return {
        ...state,
        isListening: true,
        currentInterpretation: null,
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
        requestStartedAt: Date.now(),
      };
    case 'SET_INTERPRETATION':
      return {
        ...state,
        isProcessing: false,
        currentInterpretation: action.interpretation,
        detectedLanguage: action.interpretation.detectedLanguage,
        direction: directionFor(
          action.interpretation.ttsLang ?? action.interpretation.detectedLanguage,
        ),
        interimTranscript: '',
        lastError: null,
        requestStartedAt: null,
        lastCloudAiSuccessAt:
          action.interpretation.model === 'OLLAMA'
            ? Date.now()
            : state.lastCloudAiSuccessAt,
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
    case 'SET_LAST_INPUT':
      return { ...state, lastInputSnapshot: action.input };
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
        requestStartedAt: null,
      };
    case 'SET_ERROR':
      return {
        ...state,
        lastError: action.error,
        isProcessing: false,
        requestStartedAt: null,
      };
    case 'PUSH_HISTORY':
      return { ...state, history: [action.record, ...state.history].slice(0, 100) };
    case 'UPDATE_HISTORY':
      return {
        ...state,
        history: state.history.map((h) =>
          h.id === action.id ? { ...h, ...action.patch } : h,
        ),
      };
    case 'REMOVE_HISTORY_RECORD':
      return {
        ...state,
        currentInterpretation:
          state.currentInterpretation?.id === action.id
            ? null
            : state.currentInterpretation,
        history: state.history.filter((h) => h.id !== action.id),
      };
    case 'CLEAR_HISTORY':
      return { ...state, history: [], sessionInferredSpeaker: null };
    case 'HYDRATE_HISTORY':
      return { ...state, history: action.history };
  }
}

function resultToInterpretation(result: InterpretationResult): Interpretation {
  const inputType =
    result.contributingChannels.length > 1
      ? 'compound'
      : result.sourceType === 'speech'
        ? result.visionUsed
          ? 'vision+speech'
          : 'speech'
        : result.sourceType === 'symbols'
          ? 'symbols'
          : 'text';

  return {
    id: result.id,
    ts: result.ts,
    primary: result.primaryText,
    patientLanguageText: result.patientLanguageText,
    caregiverLanguageText: result.caregiverLanguageText,
    alternates: result.alternates,
    confidence: result.confidence,
    urgency: result.urgency,
    mood: result.mood,
    detectedLanguage: result.detectedLanguage,
    translation: result.translation,
    ttsLang: result.ttsLang,
    bilingualAmbiguous: result.bilingualAmbiguous,
    inferredSpeaker: result.inferredSpeaker,
    model: isModelId(result.sourceModel) ? result.sourceModel : 'OLLAMA',
    latencyMs: result.latencyMs,
    inputType,
    visionUsed: result.visionUsed,
    dictionaryMatchIds: result.dictionaryMatchIds,
    contributingChannels: result.contributingChannels,
    sourceFragment: result.sourceFragment,
    environmentScan: result.environmentScan,
    environmentSummary: result.environmentSummary,
    environmentSuggestedPhrases: result.environmentSuggestedPhrases,
    environmentScheduleHints: result.environmentScheduleHints,
    telemetry: result.telemetry,
  };
}

function isModelId(value: string): value is ModelId {
  return (
    value === 'E2B' || value === 'E4B' || value === '27B' || value === 'OLLAMA'
  );
}

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

interface SessionContextValue {
  state: SessionState;
  dispatch: React.Dispatch<Action>;
  submit: (req: InferenceRequest) => Promise<InterpretationResult | null>;
  acceptAlternate: (alt: string) => void;
  applyActionTaken: (id: string, actionTaken: string, cancelled?: boolean) => void;
  undoLastInterpretation: () => Promise<boolean>;
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
  const { settings, dispatch: settingsDispatch } = useSettings();
  const syncedPrimaryRef = useRef(false);

  /** Stop capture and processing when Relay master power is turned off. */
  useEffect(() => {
    if (settings.relayPowerOn) return;
    dispatch({ type: 'SUSPEND_RELAY' });
  }, [settings.relayPowerOn]);

  /** Align session language / RTL with saved primary language on first load. */
  useEffect(() => {
    if (syncedPrimaryRef.current) return;
    syncedPrimaryRef.current = true;
    const lang = settings.language.primaryLanguage;
    dispatch({
      type: 'SET_LANGUAGE',
      language: lang,
      direction: directionFor(lang),
    });
  }, [settings.language.primaryLanguage]);

  useEffect(() => {
    save(STORAGE_KEY, state.history);
  }, [state.history]);

  const submit = useCallback(
    async (req: InferenceRequest): Promise<InterpretationResult | null> => {
      if (!settings.relayPowerOn) {
        return null;
      }
      const visionOn = req.visionOn ?? state.visionOn;
      const imageDataUrl = req.imageDataUrl ?? state.pendingImage?.dataUrl;
      const patientLanguage =
        req.patientLanguage ?? settings.language.primaryLanguage;
      const caregiverLanguage =
        req.caregiverLanguage ?? settings.language.caregiverLanguage;
      const conversationTail = formatConversationTailForPrompt(state.history);
      const input: InterpretationInput = {
        sourceType:
          req.inputType === 'symbols'
            ? 'symbols'
            : req.inputType === 'text'
              ? 'text'
              : 'speech',
        transcript: req.transcript,
        symbols: req.symbols,
        symbolIds: req.symbolIds,
        imageDataUrl,
        audioDataUrl: req.audioDataUrl,
        gestureHints: req.gestureHints,
        timeOfDay: req.timeOfDay ?? getTimeOfDay(),
        patientLanguage,
        caregiverLanguage,
        speakerRole: req.speakerRole ?? settings.language.defaultMicSpeaker,
        sessionLastInferredSpeaker: state.sessionInferredSpeaker,
        ...(conversationTail ? { conversationTail } : {}),
        language: req.language,
        urgencyHint: req.urgencyHint,
        environmentHelper: req.environmentHelper,
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
        if (imageDataUrl) interp.visionUsed = true;
        const record: InteractionRecord = {
          ...interp,
          actionTaken: interp.actionTaken ?? 'Spoken only',
          rawTranscript: req.transcript ?? req.symbols?.join(' '),
          spoken: false,
          cameraUsed: Boolean(imageDataUrl),
          sourceType: input.sourceType,
          symbolIds: req.symbolIds,
          imageDataUrl,
        };
        dispatch({
          type: 'SET_LAST_INPUT',
          input: {
            ts: Date.now(),
            sourceType: input.sourceType,
            transcript: input.transcript,
            symbols: input.symbols,
            symbolIds: input.symbolIds,
            imageDataUrl,
            audioDataUrl: req.audioDataUrl,
            contributingChannels: result.contributingChannels,
          },
        });
        dispatch({ type: 'SET_INTERPRETATION', interpretation: interp });
        dispatch({ type: 'PUSH_HISTORY', record });
        dispatch({
          type: 'SET_SESSION_INFERRED_SPEAKER',
          role: result.inferredSpeaker,
        });

        const langSettings = settings.language;
        if (
          shouldAutoAdaptFromInterpretation(
            langSettings.autoAdaptLanguages,
            interp.bilingualAmbiguous,
            result.confidence,
          )
        ) {
          const norm = normalizeDetectedToSupportedLocale(result.detectedLanguage);
          if (norm) {
            if (
              result.inferredSpeaker === 'patient' &&
              !sameLanguageFamily(norm, langSettings.primaryLanguage)
            ) {
              settingsDispatch({ type: 'SET_PRIMARY_LANGUAGE', value: norm });
              dispatch({
                type: 'SET_LANGUAGE',
                language: norm,
                direction: directionFor(norm),
              });
            } else if (
              result.inferredSpeaker === 'caregiver' &&
              !sameLanguageFamily(norm, langSettings.caregiverLanguage)
            ) {
              settingsDispatch({
                type: 'SET_CAREGIVER_LANGUAGE',
                value: norm,
              });
            }
          }
        }

        recordInterpretation(interp, result.routingReason);
        if (state.pendingImage && !req.imageDataUrl) {
          dispatch({ type: 'SET_PENDING_IMAGE', image: null });
        }
        return result;
      } catch (err) {
        dispatch({ type: 'CANCEL_CURRENT' });
        dispatch({ type: 'SET_ERROR', error: sessionErrorFromUnknown(err) });
        if (import.meta.env?.DEV) {
          console.error('[interpretationService]', err);
        }
        return null;
      }
    },
    [
      settings.relayPowerOn,
      settings.language.primaryLanguage,
      settings.language.caregiverLanguage,
      settings.language.autoAdaptLanguages,
      settings.language.defaultMicSpeaker,
      settingsDispatch,
      state.visionOn,
      state.pendingImage,
      state.sessionInferredSpeaker,
      state.history,
      recordInterpretation,
    ],
  );

  const acceptAlternate = useCallback(
    (alt: string) => {
      if (!settings.relayPowerOn) return;
      dispatch({ type: 'APPLY_ALTERNATE', alternate: alt });
    },
    [settings.relayPowerOn],
  );

  const applyActionTaken = useCallback(
    (id: string, actionTaken: string, cancelled?: boolean) => {
      dispatch({ type: 'UPDATE_HISTORY', id, patch: { actionTaken, cancelled } });
    },
    [],
  );

  const undoLastInterpretation = useCallback(async () => {
    if (!settings.relayPowerOn) return false;
    const interp = state.currentInterpretation;
    if (!interp || Date.now() - interp.ts > 8000) return false;
    await Promise.allSettled(
      (interp.dictionaryMatchIds ?? []).map((id) => decrementConfirmation(id)),
    );
    dispatch({ type: 'REMOVE_HISTORY_RECORD', id: interp.id });
    return true;
  }, [settings.relayPowerOn, state.currentInterpretation]);

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
    dispatch({ type: 'SET_ERROR', error: null });
  }, []);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      submit,
      acceptAlternate,
      applyActionTaken,
      undoLastInterpretation,
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
      undoLastInterpretation,
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
