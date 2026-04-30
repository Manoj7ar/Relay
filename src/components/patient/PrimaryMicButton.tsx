import { Mic, MicOff, Square } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PillButton } from '@/components/primitives';
import { useSession } from '@/contexts/SessionContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useHaptics } from '@/hooks/useHaptics';
import { usePermissions } from '@/hooks/usePermissions';
import { useMicrophone } from '@/hooks/useMicrophone';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import type { RecognitionError } from '@/services/speechRecognitionService';
import { MIC_COPY, type MicUiState } from '@/lib/micStateCopy';
import { pickSourceLanguageHint } from '@/lib/transcriptSpeakerHint';
import { pickMediaRecorderMimeType } from '@/lib/mediaRecorderMime';
import { cn } from '@/lib/cn';
import {
  isLocalSttConfigured,
  transcribeWithLocalStt,
} from '@/services/localSttService';

function speechErrorTitle(error: RecognitionError | null): string {
  if (!error) return 'Speech recognition unavailable';
  if (error.kind === 'network') return 'Speech recognition needs a connection';
  if (error.kind === 'permission_denied') return 'Microphone access was blocked';
  if (error.kind === 'audio_capture') return 'Could not capture audio';
  return 'Speech recognition stopped';
}

function speechErrorHint(error: RecognitionError | null): string {
  if (!error) {
    return 'Relay could not start speech-to-text in this browser. Try again or use Type instead.';
  }
  if (error.kind === 'network') {
    return isLocalSttConfigured()
      ? 'Local STT did not return text. Confirm your sidecar is running and POST /transcribe matches localSttService.ts.'
      : 'Built-in speech uses Google’s servers (not your LLM). Set VITE_RELAY_LOCAL_STT_URL in .env.local, restart dev, and run a POST /transcribe server there.';
  }
  return error.message;
}

export function PrimaryMicButton() {
  const { state, dispatch, submit, setInterimTranscript } = useSession();
  const { settings } = useSettings();
  const haptics = useHaptics();
  const permissions = usePermissions('microphone');
  const mic = useMicrophone();
  const sttLang =
    state.sessionInferredSpeaker === 'caregiver'
      ? settings.language.caregiverLanguage
      : settings.language.primaryLanguage;
  const stt = useSpeechRecognition({
    lang: sttLang,
  });
  const [finalizing, setFinalizing] = useState(false);
  const pendingSubmitRef = useRef(false);
  const speechErrorRef = useRef<RecognitionError | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  /** Blob from the last listen session (filled on stop, consumed when `stt.finalized` runs). */
  const lastRecordingRef = useRef<Blob | null>(null);

  const stopRecorderSync = useCallback(() => {
    const r = recorderRef.current;
    recorderRef.current = null;
    chunksRef.current = [];
    if (r && r.state !== 'inactive') {
      try {
        r.stop();
      } catch {
        /* ignore */
      }
    }
  }, []);

  const startRecorder = useCallback(
    (stream: MediaStream) => {
      stopRecorderSync();
      if (typeof MediaRecorder === 'undefined') return;
      const mime = pickMediaRecorderMimeType();
      try {
        const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
        chunksRef.current = [];
        r.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        r.start(250);
        recorderRef.current = r;
      } catch {
        /* MediaRecorder unsupported or bad mime */
      }
    },
    [stopRecorderSync],
  );

  const stopRecorder = useCallback((): Promise<Blob | null> => {
    const r = recorderRef.current;
    if (!r) return Promise.resolve(null);

    const mimeBase =
      (r.mimeType?.split(';')[0] || 'audio/webm').trim() || 'audio/webm';

    if (r.state === 'inactive') {
      recorderRef.current = null;
      const blob = new Blob(chunksRef.current, { type: mimeBase });
      chunksRef.current = [];
      return Promise.resolve(blob.size > 0 ? blob : null);
    }

    return new Promise((resolve) => {
      r.addEventListener(
        'stop',
        () => {
          recorderRef.current = null;
          const blob = new Blob(chunksRef.current, { type: mimeBase });
          chunksRef.current = [];
          resolve(blob.size > 0 ? blob : null);
        },
        { once: true },
      );
      try {
        r.stop();
      } catch {
        recorderRef.current = null;
        const blob = new Blob(chunksRef.current, { type: mimeBase });
        chunksRef.current = [];
        resolve(blob.size > 0 ? blob : null);
      }
    });
  }, []);

  useEffect(() => {
    setInterimTranscript(stt.interimTranscript);
  }, [stt.interimTranscript, setInterimTranscript]);

  /** Full teardown: recognition + media stream + session listening flag. */
  const stopAll = useCallback(() => {
    stopRecorderSync();
    stt.stop();
    mic.stop();
    dispatch({ type: 'STOP_LISTEN' });
  }, [dispatch, mic.stop, stt.stop, stopRecorderSync]);

  /**
   * End the "listening" UX and stop recognition, but keep the mic stream open
   * briefly. Stopping the MediaStream in the same tick as `SpeechRecognition.stop()`
   * often prevents Chrome from emitting final results, so `onFinal` never runs.
   */
  const stopRecognitionKeepMic = useCallback(() => {
    stt.stop();
    dispatch({ type: 'STOP_LISTEN' });
  }, [dispatch, stt.stop]);

  useEffect(() => {
    if (!stt.finalized) return;
    if (pendingSubmitRef.current) return;
    pendingSubmitRef.current = true;

    const recording = lastRecordingRef.current;
    lastRecordingRef.current = null;
    const initialTranscript = stt.finalized.transcript.trim();

    const run = async () => {
      let transcript = initialTranscript;
      if (!transcript && recording && isLocalSttConfigured()) {
        try {
          transcript = (
            await transcribeWithLocalStt(recording, sttLang)
          ).trim();
        } catch {
          /* keep empty */
        }
      }

      stopAll();
      stt.reset();

      if (!transcript) {
        pendingSubmitRef.current = false;
        setFinalizing(false);
        return;
      }

      setFinalizing(true);
      const languageHint = pickSourceLanguageHint(
        transcript,
        settings.language.primaryLanguage,
        settings.language.caregiverLanguage,
        state.sessionInferredSpeaker,
      );
      void submit({
        inputType: state.visionOn ? 'vision+speech' : 'speech',
        transcript,
        visionOn: state.visionOn,
        language: languageHint,
        patientLanguage: settings.language.primaryLanguage,
        caregiverLanguage: settings.language.caregiverLanguage,
      }).finally(() => {
        pendingSubmitRef.current = false;
        setFinalizing(false);
      });
    };

    void run();
  }, [
    stt.finalized,
    stt.reset,
    submit,
    state.visionOn,
    settings.language.primaryLanguage,
    settings.language.caregiverLanguage,
    state.sessionInferredSpeaker,
    stopAll,
    sttLang,
  ]);

  useEffect(() => () => stopRecorderSync(), [stopRecorderSync]);

  useEffect(() => {
    if (stt.status !== 'error') return;
    setFinalizing(false);
    speechErrorRef.current = stt.error;
    stt.abort();
  }, [stt.abort, stt.error, stt.status]);

  /** If Web Speech never delivers `onend`/`onFinal`, avoid a stuck "Interpreting…" pill. */
  useEffect(() => {
    if (!finalizing) return undefined;
    const id = window.setTimeout(() => {
      if (pendingSubmitRef.current || state.isProcessing) return;
      pendingSubmitRef.current = false;
      lastRecordingRef.current = null;
      setFinalizing(false);
      stopRecorderSync();
      mic.stop();
      stt.abort();
      dispatch({ type: 'STOP_LISTEN' });
      dispatch({
        type: 'SET_ERROR',
        error: {
          code: 'speech_recognition',
          title: 'Speech recognition timed out',
          hint: 'Relay did not receive final text after you stopped speaking. Try again, use Type, or check your local STT sidecar.',
          technical: 'finalize_timeout',
        },
      });
    }, 3500);
    return () => window.clearTimeout(id);
  }, [
    dispatch,
    finalizing,
    state.isProcessing,
    mic.stop,
    stt.abort,
    stopRecorderSync,
  ]);

  const uiState: MicUiState = (() => {
    if (permissions.state === 'denied') return 'permission_denied';
    if (!mic.supported && !stt.supported) return 'unsupported_browser';
    if (permissions.requesting || mic.state === 'requesting_permission') {
      return 'requesting_permission';
    }
    if (state.isProcessing || finalizing) return 'processing';
    if (state.isListening) return 'listening';
    if (state.currentInterpretation) return 'transcript_ready';
    return 'mic_off';
  })();

  const copy = MIC_COPY[uiState];

  const handleTap = async () => {
    haptics('tap');

    if (state.isListening) {
      const speechError = speechErrorRef.current;
      const audioBlob = await stopRecorder();

      if (speechError || !stt.supported) {
        speechErrorRef.current = null;
        if (audioBlob && isLocalSttConfigured()) {
          try {
            const t = (await transcribeWithLocalStt(audioBlob, sttLang)).trim();
            if (t) {
              setFinalizing(true);
              pendingSubmitRef.current = true;
              stopAll();
              stt.reset();
              const languageHint = pickSourceLanguageHint(
                t,
                settings.language.primaryLanguage,
                settings.language.caregiverLanguage,
                state.sessionInferredSpeaker,
              );
              void submit({
                inputType: state.visionOn ? 'vision+speech' : 'speech',
                transcript: t,
                visionOn: state.visionOn,
                language: languageHint,
                patientLanguage: settings.language.primaryLanguage,
                caregiverLanguage: settings.language.caregiverLanguage,
              }).finally(() => {
                pendingSubmitRef.current = false;
                setFinalizing(false);
              });
              return;
            }
          } catch {
            /* fall through to session error */
          }
        }
        setFinalizing(false);
        stopAll();
        stt.reset();
        dispatch({
          type: 'SET_ERROR',
          error: {
            code: 'speech_recognition',
            title: speechErrorTitle(speechError),
            hint: speechErrorHint(speechError),
            technical: speechError?.kind,
          },
        });
        return;
      }

      lastRecordingRef.current = audioBlob;
      setFinalizing(true);
      stopRecognitionKeepMic();
      return;
    }

    if (uiState === 'processing') return;

    pendingSubmitRef.current = false;
    speechErrorRef.current = null;
    setFinalizing(false);
    stt.reset();

    if (permissions.state !== 'granted') {
      const granted = await permissions.request();
      if (granted !== 'granted') return;
    }

    const handle = await mic.start();
    if (!handle) return;
    startRecorder(handle.stream);
    dispatch({ type: 'START_LISTEN' });

    if (stt.supported) {
      stt.start();
    }
  };

  const disabled =
    uiState === 'processing' ||
    (uiState === 'permission_denied' && !state.isListening);

  return (
    <PillButton
      onClick={handleTap}
      disabled={disabled}
      fullWidth
      size="lg"
      variant={state.isListening ? 'danger' : 'accent'}
      leftIcon={
        uiState === 'permission_denied' ? (
          <MicOff className="h-5 w-5" aria-hidden />
        ) : state.isListening ? (
          <Square className="h-5 w-5 fill-current" aria-hidden />
        ) : (
          <Mic
            className={cn(
              'h-5 w-5',
              uiState === 'processing' && 'animate-pulse2',
            )}
            aria-hidden
          />
        )
      }
      className={cn(
        'relay-home-pill text-lg',
        state.isListening &&
          'motion-safe:animate-listen-glow motion-reduce:animate-none',
        uiState === 'processing' &&
          !state.isListening &&
          'motion-safe:animate-process-glow motion-reduce:animate-none',
      )}
      aria-pressed={state.isListening}
      aria-label={copy.ariaLabel}
      style={
        state.isListening && mic.level > 0
          ? {
              transform: `scale(${1 + Math.min(0.04, mic.level * 0.08)})`,
              transition: 'transform 80ms linear',
            }
          : undefined
      }
    >
      {copy.label}
    </PillButton>
  );
}
