import { Mic, Square } from 'lucide-react';
import { useRef } from 'react';
import { PillButton } from '@/components/primitives';
import { useSession } from '@/contexts/SessionContext';
import { useHaptics } from '@/hooks/useHaptics';
import { startRecording, type SpeechSession } from '@/services/speech';
import { cn } from '@/lib/cn';

export function PrimaryMicButton() {
  const { state, dispatch, submit } = useSession();
  const haptics = useHaptics();
  const sessionRef = useRef<SpeechSession | null>(null);

  const handleTap = async () => {
    if (state.isProcessing) return;
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

  const label = state.isListening
    ? 'Tap to stop'
    : state.isProcessing
      ? 'Interpreting…'
      : 'Tap to speak';

  return (
    <PillButton
      onClick={handleTap}
      disabled={state.isProcessing}
      fullWidth
      size="xl"
      variant={state.isListening ? 'danger' : 'accent'}
      leftIcon={
        state.isListening ? (
          <Square className="h-6 w-6 fill-current" aria-hidden />
        ) : (
          <Mic
            className={cn(
              'h-6 w-6',
              state.isProcessing && 'animate-pulse2',
            )}
            aria-hidden
          />
        )
      }
      className="text-xl"
      aria-pressed={state.isListening}
    >
      {label}
    </PillButton>
  );
}
