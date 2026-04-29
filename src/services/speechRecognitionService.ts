/**
 * Browser Web Speech API wrapper.
 *
 * Feature-detects `SpeechRecognition`/`webkitSpeechRecognition`. If absent,
 * consumers should fall back to the Type-instead sheet.
 *
 * With `continuous: true` (home mic), browsers still end each **segment** after
 * a pause (~1s) and fire `onend`. We **bridge** by starting a **new**
 * `SpeechRecognition` instance (reusing `rec.start()` on the same object is
 * unreliable across Chrome/Safari). Tap `stop()` on the handle ends the run and
 * delivers one merged `onFinal`.
 */

export type RecognitionStatus =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'error'
  | 'unsupported';

export type RecognitionErrorKind =
  | 'no_speech'
  | 'permission_denied'
  | 'network'
  | 'audio_capture'
  | 'language_not_supported'
  | 'aborted'
  | 'unknown';

export interface RecognitionError {
  kind: RecognitionErrorKind;
  message: string;
}

export interface RecognitionResult {
  transcript: string;
  interimTranscript: string;
  /** Confidence 0..1 for the final best alternative, when the browser reports one. */
  confidence: number | null;
  status: RecognitionStatus;
  error: RecognitionError | null;
}

export interface RecognitionHandle {
  stop: () => void;
  abort: () => void;
}

export interface RecognitionCallbacks {
  onUpdate: (partial: Partial<RecognitionResult>) => void;
  onFinal: (transcript: string, confidence: number | null) => void;
  onEnd: () => void;
}

function getConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  return (
    window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
  );
}

export function isSpeechRecognitionSupported(): boolean {
  return getConstructor() !== null;
}

function mapError(err: string): RecognitionError {
  switch (err) {
    case 'no-speech':
      return { kind: 'no_speech', message: 'No speech was detected.' };
    case 'not-allowed':
    case 'service-not-allowed':
      return {
        kind: 'permission_denied',
        message: 'Microphone access was blocked.',
      };
    case 'network':
      return {
        kind: 'network',
        message: 'Speech recognition needs a network connection.',
      };
    case 'audio-capture':
      return {
        kind: 'audio_capture',
        message: 'Could not capture audio.',
      };
    case 'language-not-supported':
      return {
        kind: 'language_not_supported',
        message: 'This language is not supported on this device.',
      };
    case 'aborted':
      return { kind: 'aborted', message: 'Recognition was cancelled.' };
    default:
      return { kind: 'unknown', message: `Speech recognition error: ${err}` };
  }
}

function mergeFinalAndInterim(final: string, interim: string): string {
  const a = final.trim();
  const b = interim.trim();
  if (!a) return b;
  if (!b) return a;
  return `${a} ${b}`.replace(/\s+/g, ' ').trim();
}

/** After these errors, do not bridge to another segment; user or device must intervene. */
const FATAL_FOR_BRIDGE: ReadonlySet<RecognitionErrorKind> = new Set([
  'permission_denied',
  'aborted',
  'language_not_supported',
  'audio_capture',
  /** Cloud STT (e.g. Chromium) cannot proceed; swallowing caused endless empty bridged segments. */
  'network',
]);

const MAX_CONTINUOUS_BRIDGE = 120;
/** Delay before starting the next segment; avoids InvalidStateError on same tick as `onend`. */
const BRIDGE_RESTART_MS = 80;

export interface RecognitionOptions {
  lang?: string;
  /** Continuous hint for the engine; bridging still uses fresh instances when needed. */
  continuous?: boolean;
  /** Surface partial transcripts; default true. */
  interimResults?: boolean;
  maxAlternatives?: number;
}

/**
 * Start a recognition run. The caller receives a handle to stop/abort.
 * With `continuous: true`, segment `onend` events start a new recognition until `stop()`.
 */
export function startRecognition(
  opts: RecognitionOptions,
  callbacks: RecognitionCallbacks,
): RecognitionHandle {
  const Ctor = getConstructor();
  if (!Ctor) {
    callbacks.onUpdate({
      status: 'unsupported',
      error: {
        kind: 'unknown',
        message: 'Speech recognition is not supported in this browser.',
      },
    });
    callbacks.onEnd();
    return { stop: () => undefined, abort: () => undefined };
  }

  const engineContinuous = opts.continuous ?? false;

  let stopped = false;
  let aborted = false;
  let finalTranscript = '';
  let finalConfidence: number | null = null;
  let lastInterim = '';
  let lastErrorKind: RecognitionErrorKind | null = null;
  let bridgeCount = 0;
  /** Active instance (each segment gets a new object). */
  let currentRec: SpeechRecognition | null = null;
  let bridgeTimer: ReturnType<typeof setTimeout> | null = null;
  let sessionFinished = false;

  const clearBridgeTimer = () => {
    if (bridgeTimer !== null) {
      clearTimeout(bridgeTimer);
      bridgeTimer = null;
    }
  };

  const finishSession = () => {
    if (sessionFinished) {
      return;
    }
    sessionFinished = true;
    stopped = true;
    clearBridgeTimer();
    currentRec = null;
    const combined = mergeFinalAndInterim(finalTranscript, lastInterim);
    lastInterim = '';
    bridgeCount = 0;
    callbacks.onFinal(combined, finalConfidence);
    callbacks.onUpdate({ status: 'idle', interimTranscript: '' });
    callbacks.onEnd();
  };

  const attachSegment = () => {
    if (aborted || stopped) return;

    const rec = new Ctor();
    currentRec = rec;
    rec.continuous = engineContinuous;
    rec.interimResults = opts.interimResults ?? true;
    rec.maxAlternatives = opts.maxAlternatives ?? 3;
    if (opts.lang) rec.lang = opts.lang;

    /** Text already merged before this `SpeechRecognition` segment (after bridging). */
    const segmentStartFinal = finalTranscript;

    rec.onstart = () => {
      lastErrorKind = null;
      callbacks.onUpdate({ status: 'listening', error: null });
    };

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let segmentFinal = '';
      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const alt = result[0];
        if (result.isFinal) {
          segmentFinal += alt.transcript;
          if (typeof alt.confidence === 'number') {
            finalConfidence = alt.confidence;
          }
        } else {
          interim += alt.transcript;
        }
      }
      lastInterim = interim;
      finalTranscript = segmentStartFinal + segmentFinal;
      callbacks.onUpdate({
        transcript: mergeFinalAndInterim(finalTranscript, interim),
        interimTranscript: interim,
        confidence: finalConfidence,
      });
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      const err = mapError(event.error);
      lastErrorKind = err.kind;
      if (engineContinuous && !FATAL_FOR_BRIDGE.has(err.kind)) {
        /* Transient engine errors; `onend` will bridge or finish. Surfacing
         * `status: error` makes PrimaryMicButton call stopAll() and ends the run. */
        return;
      }
      callbacks.onUpdate({ status: 'error', error: err });
    };

    rec.onend = () => {
      if (aborted) {
        clearBridgeTimer();
        currentRec = null;
        lastInterim = '';
        bridgeCount = 0;
        callbacks.onUpdate({ status: 'idle', interimTranscript: '' });
        callbacks.onEnd();
        return;
      }

      if (sessionFinished) return;

      /* Fatal error already surfaced in `onerror`; do not flush an empty `onFinal` or clobber error with idle. */
      if (lastErrorKind !== null && FATAL_FOR_BRIDGE.has(lastErrorKind)) {
        clearBridgeTimer();
        currentRec = null;
        lastInterim = '';
        bridgeCount = 0;
        sessionFinished = true;
        stopped = true;
        callbacks.onEnd();
        return;
      }

      const canBridge =
        engineContinuous &&
        !stopped &&
        bridgeCount < MAX_CONTINUOUS_BRIDGE &&
        (lastErrorKind === null || !FATAL_FOR_BRIDGE.has(lastErrorKind));

      if (canBridge) {
        bridgeCount += 1;
        const merged = mergeFinalAndInterim(finalTranscript, lastInterim);
        finalTranscript = merged;
        lastInterim = '';
        callbacks.onUpdate({
          transcript: finalTranscript,
          interimTranscript: '',
          confidence: finalConfidence,
        });

        clearBridgeTimer();
        currentRec = null;
        bridgeTimer = setTimeout(() => {
          bridgeTimer = null;
          if (stopped || aborted) return;
          attachSegment();
        }, BRIDGE_RESTART_MS);
        return;
      }

      finishSession();
    };

    try {
      rec.start();
    } catch {
      stopped = true;
      finishSession();
    }
  };

  attachSegment();

  return {
    stop: () => {
      if (stopped) {
        return;
      }
      stopped = true;
      clearBridgeTimer();
      if (currentRec) {
        try {
          currentRec.stop();
        } catch {
          finishSession();
        }
      } else {
        /* Between bridged segments there is no live instance, so `onend` never
         * fires — flush accumulated text so the client can submit. */
        finishSession();
      }
    },
    abort: () => {
      if (stopped) return;
      stopped = true;
      aborted = true;
      clearBridgeTimer();
      if (currentRec) {
        try {
          currentRec.abort();
        } catch {
          // ignore
        }
      } else {
        currentRec = null;
        lastInterim = '';
        bridgeCount = 0;
        callbacks.onUpdate({ status: 'idle', interimTranscript: '' });
        callbacks.onEnd();
      }
    },
  };
}
