import { useCallback, useEffect, useRef, useState } from 'react';
import {
  isSpeechRecognitionSupported,
  startRecognition,
  type RecognitionError,
  type RecognitionHandle,
  type RecognitionResult,
  type RecognitionStatus,
} from '@/services/speechRecognitionService';

interface UseSTTOptions {
  lang?: string;
}

const INITIAL: RecognitionResult = {
  transcript: '',
  interimTranscript: '',
  confidence: null,
  status: 'idle',
  error: null,
};

export function useSpeechRecognition(opts: UseSTTOptions = {}) {
  const [result, setResult] = useState<RecognitionResult>(INITIAL);
  const [finalized, setFinalized] = useState<{
    transcript: string;
    confidence: number | null;
  } | null>(null);
  const handleRef = useRef<RecognitionHandle | null>(null);
  const supportedRef = useRef(isSpeechRecognitionSupported());

  useEffect(() => {
    return () => {
      handleRef.current?.abort();
      handleRef.current = null;
    };
  }, []);

  const reset = useCallback(() => {
    setResult(INITIAL);
    setFinalized(null);
  }, []);

  const start = useCallback(() => {
    if (handleRef.current) return;
    setFinalized(null);
    setResult({ ...INITIAL, status: 'listening' });
    handleRef.current = startRecognition(
      {
        lang: opts.lang,
        continuous: false,
        interimResults: true,
      },
      {
        onUpdate: (partial) =>
          setResult((prev) => ({ ...prev, ...partial })),
        onFinal: (transcript, confidence) => {
          setFinalized({ transcript, confidence });
        },
        onEnd: () => {
          handleRef.current = null;
        },
      },
    );
  }, [opts.lang]);

  const stop = useCallback(() => {
    handleRef.current?.stop();
  }, []);

  const abort = useCallback(() => {
    handleRef.current?.abort();
    handleRef.current = null;
    setResult(INITIAL);
  }, []);

  return {
    status: result.status as RecognitionStatus,
    transcript: result.transcript,
    interimTranscript: result.interimTranscript,
    confidence: result.confidence,
    error: result.error as RecognitionError | null,
    supported: supportedRef.current,
    finalized,
    reset,
    start,
    stop,
    abort,
  };
}
