/**
 * Browser Web Speech API wrapper.
 *
 * Feature-detects `SpeechRecognition`/`webkitSpeechRecognition`. If absent,
 * consumers should fall back to the Type-instead sheet.
 * No auto-restart loops — each `start()` is one logical "utterance".
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

export interface RecognitionOptions {
  lang?: string;
  /** Continuous keeps the recognizer listening after a pause; default false for mobile. */
  continuous?: boolean;
  /** Surface partial transcripts; default true. */
  interimResults?: boolean;
  maxAlternatives?: number;
}

/**
 * Start a recognition run. The caller receives a handle to stop/abort.
 * The service does not auto-restart on `end` — one run per tap.
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

  const rec = new Ctor();
  rec.continuous = opts.continuous ?? false;
  rec.interimResults = opts.interimResults ?? true;
  rec.maxAlternatives = opts.maxAlternatives ?? 3;
  if (opts.lang) rec.lang = opts.lang;

  let stopped = false;
  let finalTranscript = '';
  let finalConfidence: number | null = null;

  rec.onstart = () => {
    callbacks.onUpdate({ status: 'listening', error: null });
  };

  rec.onresult = (event: SpeechRecognitionEvent) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const alt = result[0];
      if (result.isFinal) {
        finalTranscript += alt.transcript;
        if (typeof alt.confidence === 'number') {
          finalConfidence = alt.confidence;
        }
      } else {
        interim += alt.transcript;
      }
    }
    callbacks.onUpdate({
      transcript: finalTranscript,
      interimTranscript: interim,
      confidence: finalConfidence,
    });
  };

  rec.onerror = (event: SpeechRecognitionErrorEvent) => {
    const err = mapError(event.error);
    callbacks.onUpdate({ status: 'error', error: err });
  };

  rec.onend = () => {
    const trimmed = finalTranscript.trim();
    if (trimmed) {
      callbacks.onFinal(trimmed, finalConfidence);
    }
    callbacks.onUpdate({ status: 'idle', interimTranscript: '' });
    callbacks.onEnd();
  };

  try {
    rec.start();
  } catch (err) {
    callbacks.onUpdate({
      status: 'error',
      error: {
        kind: 'unknown',
        message: err instanceof Error ? err.message : String(err),
      },
    });
    callbacks.onEnd();
  }

  return {
    stop: () => {
      if (stopped) return;
      stopped = true;
      try {
        rec.stop();
      } catch {
        // ignore
      }
    },
    abort: () => {
      if (stopped) return;
      stopped = true;
      try {
        rec.abort();
      } catch {
        // ignore
      }
    },
  };
}
