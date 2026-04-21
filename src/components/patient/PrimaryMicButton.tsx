import { Mic, Square } from 'lucide-react';
import { useRef } from 'react';
import { PillButton } from '@/components/primitives';
import { useSession } from '@/contexts/SessionContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useHaptics } from '@/hooks/useHaptics';
import { startRecording, type SpeechSession } from '@/services/speech';
import { cn } from '@/lib/cn';

export function PrimaryMicButton() {
  const { state, dispatch, submit } = useSession();
  const { settings } = useSettings();
  const haptics = useHaptics();
  const sessionRef = useRef<SpeechSession | null>(null);
  const demoMode = settings.demoMode;

  const handleTap = async () => {
    if (state.isProcessing || demoMode) return;
    haptics('tap');
    if (state.isListening) {
      const current = sessionRef.current;
      sessionRef.current = null;
      dispatch({ type: 'STOP_LISTEN' });
      const transcript = current ? await current.stop() : '';
      await submit({
        inputType: state.visionOn ? 'vision+speech' : 'speech',
        transcript,
        visionOn: state.visionOn,
      });
    } else {
      dispatch({ type: 'START_LISTEN' });
      sessionRef.current = await startRecording();
    }
  };

  const label = demoMode
    ? 'Demo mode — use Demo tab'
    : state.isListening
      ? 'Tap to stop'
      : state.isProcessing
        ? 'Interpreting…'
        : 'Tap to speak';

  return (
    <PillButton
      onClick={handleTap}
      disabled={state.isProcessing || demoMode}
      fullWidth
      size="lg"
      variant={state.isListening ? 'danger' : 'accent'}
      leftIcon={
        state.isListening ? (
          <Square className="h-5 w-5 fill-current" aria-hidden />
        ) : (
          <Mic
            className={cn(
              'h-5 w-5',
              state.isProcessing && 'animate-pulse2',
            )}
            aria-hidden
          />
        )
      }
      className="!min-h-[68px] text-lg"
      aria-pressed={state.isListening}
    >
      {label}
    </PillButton>
  );
}
