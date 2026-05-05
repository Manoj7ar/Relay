import { Mic, MicOff, Square } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PillButton } from '@/components/primitives';
import { useSession } from '@/contexts/SessionContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useHaptics } from '@/hooks/useHaptics';
import { usePermissions } from '@/hooks/usePermissions';
import { useMicrophone } from '@/hooks/useMicrophone';
import { MIC_COPY, type MicUiState } from '@/lib/micStateCopy';
import { pickMediaRecorderMimeType } from '@/lib/mediaRecorderMime';
import { cn } from '@/lib/cn';
import { transcribeTapToSpeak } from '@/services/interpretation/localTranscription';

/** Skip tiny recorder glitches; real clips from tap-to-speak are usually larger. */
const MIN_RECORDED_AUDIO_BLOB_BYTES = 320;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('Could not read audio.'));
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.readAsDataURL(blob);
  });
}

export function PrimaryMicButton() {
  const { state, dispatch, submit } = useSession();
  const { settings } = useSettings();
  const haptics = useHaptics();
  const permissions = usePermissions('microphone');
  const mic = useMicrophone();
  const [finalizing, setFinalizing] = useState(false);
  const pendingSubmitRef = useRef(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

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
    (stream: MediaStream): boolean => {
      stopRecorderSync();
      if (typeof MediaRecorder === 'undefined') return false;
      const mime = pickMediaRecorderMimeType();
      try {
        const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
        chunksRef.current = [];
        r.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        r.start(250);
        recorderRef.current = r;
        return true;
      } catch {
        /* MediaRecorder unsupported or bad mime */
        return false;
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

  /** Full teardown: recorder + media stream + session listening flag. */
  const stopAll = useCallback(() => {
    stopRecorderSync();
    mic.stop();
    dispatch({ type: 'STOP_LISTEN' });
  }, [dispatch, mic.stop, stopRecorderSync]);

  useEffect(() => () => stopRecorderSync(), [stopRecorderSync]);

  const uiState: MicUiState = (() => {
    if (permissions.state === 'denied') return 'permission_denied';
    if (!mic.supported || typeof MediaRecorder === 'undefined') return 'unsupported_browser';
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
      const audioBlob = await stopRecorder();
      stopAll();

      if (!audioBlob || audioBlob.size < MIN_RECORDED_AUDIO_BLOB_BYTES) {
        setFinalizing(false);
        dispatch({
          type: 'SET_ERROR',
          error: {
            code: 'speech_recognition',
            title: 'No speech audio captured',
            hint: 'Try again, hold the button session a little longer, or use Type instead.',
            technical: audioBlob ? `audio_size:${audioBlob.size}` : 'audio_blob_missing',
          },
        });
        return;
      }

      setFinalizing(true);
      pendingSubmitRef.current = true;
      try {
        const transcript = await transcribeTapToSpeak(
          audioBlob,
          settings.language.primaryLanguage,
        );
        if (!transcript.trim()) {
          dispatch({
            type: 'SET_ERROR',
            error: {
              code: 'speech_recognition',
              title: 'Could not transcribe audio',
              hint: 'Check your Ollama API key and network, configure local STT (VITE_RELAY_LOCAL_STT_URL), or use Type instead.',
            },
          });
          return;
        }
        const audioDataUrl = await blobToDataUrl(audioBlob);
        await submit({
          inputType: state.visionOn ? 'vision+speech' : 'speech',
          transcript: transcript.trim(),
          audioDataUrl,
          visionOn: state.visionOn,
          language: settings.language.primaryLanguage,
          patientLanguage: settings.language.primaryLanguage,
          caregiverLanguage: settings.language.caregiverLanguage,
        });
      } catch (err) {
        dispatch({
          type: 'SET_ERROR',
          error: {
            code: 'speech_recognition',
            title: 'Could not prepare audio',
            hint: err instanceof Error ? err.message : 'Try again or use Type instead.',
          },
        });
      } finally {
        pendingSubmitRef.current = false;
        setFinalizing(false);
      }
      return;
    }

    if (uiState === 'processing') return;

    pendingSubmitRef.current = false;
    setFinalizing(false);

    if (permissions.state !== 'granted') {
      const granted = await permissions.request();
      if (granted !== 'granted') return;
    }

    const handle = await mic.start();
    if (!handle) return;
    if (!startRecorder(handle.stream)) {
      mic.stop();
      dispatch({
        type: 'SET_ERROR',
        error: {
          code: 'speech_recognition',
          title: 'Audio recording is unavailable',
          hint: 'This browser cannot record audio for Ollama. Use Type instead.',
        },
      });
      return;
    }
    dispatch({ type: 'START_LISTEN' });
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
