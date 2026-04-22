import { Mic, MicOff, Square } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PillButton } from '@/components/primitives';
import { useSession } from '@/contexts/SessionContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useHaptics } from '@/hooks/useHaptics';
import { usePermissions } from '@/hooks/usePermissions';
import { useMicrophone } from '@/hooks/useMicrophone';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { MIC_COPY, type MicUiState } from '@/lib/micStateCopy';
import { cn } from '@/lib/cn';

export function PrimaryMicButton() {
  const { state, dispatch, submit, setInterimTranscript } = useSession();
  const { settings } = useSettings();
  const haptics = useHaptics();
  const permissions = usePermissions('microphone');
  const mic = useMicrophone();
  const stt = useSpeechRecognition({
    lang: settings.language.primaryLanguage,
  });
  const [finalizing, setFinalizing] = useState(false);
  const pendingSubmitRef = useRef(false);

  useEffect(() => {
    setInterimTranscript(stt.interimTranscript);
  }, [stt.interimTranscript, setInterimTranscript]);

  const stopAll = useCallback(() => {
    stt.stop();
    mic.stop();
    dispatch({ type: 'STOP_LISTEN' });
  }, [dispatch, mic, stt]);

  useEffect(() => {
    if (!stt.finalized) return;
    if (pendingSubmitRef.current) return;
    pendingSubmitRef.current = true;
    setFinalizing(true);
    stopAll();
    const transcript = stt.finalized.transcript;
    stt.reset();
    void submit({
      inputType: state.visionOn ? 'vision+speech' : 'speech',
      transcript,
      visionOn: state.visionOn,
      language: settings.language.primaryLanguage,
    }).finally(() => {
      pendingSubmitRef.current = false;
      setFinalizing(false);
    });
  }, [
    stt,
    stt.finalized,
    submit,
    state.visionOn,
    settings.language.primaryLanguage,
    stopAll,
  ]);

  useEffect(() => {
    if (stt.status !== 'error') return;
    stopAll();
  }, [stt.status, stopAll]);

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
      stopAll();
      return;
    }

    if (uiState === 'processing') return;

    if (permissions.state !== 'granted') {
      const granted = await permissions.request();
      if (granted !== 'granted') return;
    }

    const handle = await mic.start();
    if (!handle) return;
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
        'primary-mic text-lg',
        state.isListening &&
          'shadow-[0_0_0_4px_rgba(255,107,107,0.18)] transition-shadow',
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
