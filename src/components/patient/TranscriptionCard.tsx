import { Camera, Cpu, Sparkles } from 'lucide-react';
import { Card } from '@/components/primitives';
import { StreamingText } from './StreamingText';
import { ConfidenceMoodRow } from './ConfidenceMoodRow';
import { InterpretationAlternates } from './InterpretationAlternates';
import { CameraToggle } from './CameraToggle';
import { useSession } from '@/contexts/SessionContext';
import { cn } from '@/lib/cn';

export function TranscriptionCard() {
  const { state, acceptAlternate, dispatch } = useSession();
  const { currentInterpretation, isListening, isProcessing, visionOn } = state;

  const placeholderTitle = isListening
    ? 'Listening…'
    : isProcessing
      ? 'Interpreting…'
      : 'Tap the mic to start';

  return (
    <Card
      variant="glass-strong"
      padded={false}
      className={cn(
        'relative flex flex-1 flex-col justify-between',
        'min-h-[58dvh] px-5 pb-5 pt-4',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Interpretation
        </div>
        <div className="flex items-center gap-2">
          {state.visionOn ? (
            <span
              aria-hidden
              className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white"
            >
              <Camera className="h-3 w-3" /> Camera
            </span>
          ) : null}
          <CameraToggle
            on={visionOn}
            onToggle={() => dispatch({ type: 'TOGGLE_VISION' })}
          />
        </div>
      </div>

      <div className="my-4 flex-1 flex flex-col justify-center">
        {currentInterpretation ? (
          <StreamingText
            text={currentInterpretation.primary}
            className="text-[30px] sm:text-[34px] font-semibold"
          />
        ) : (
          <p className="text-center text-[22px] font-medium text-muted">
            {placeholderTitle}
          </p>
        )}

        {currentInterpretation?.translation ? (
          <p
            className="mt-3 text-base text-muted"
            dir="auto"
          >
            {currentInterpretation.translation}
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        {currentInterpretation ? (
          <>
            <ConfidenceMoodRow
              confidence={currentInterpretation.confidence}
              urgency={currentInterpretation.urgency}
              mood={currentInterpretation.mood}
            />
            <InterpretationAlternates
              alternates={currentInterpretation.alternates}
              onSelect={acceptAlternate}
            />
            <div className="flex items-center justify-between text-[11px] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5" aria-hidden />
                Processed by {currentInterpretation.model}
                {currentInterpretation.visionUsed ? ' · vision+voice' : ''}
              </span>
              <span>{currentInterpretation.latencyMs} ms</span>
            </div>
          </>
        ) : (
          <p className="text-center text-sm text-muted">
            Your words will appear here.
          </p>
        )}
      </div>
    </Card>
  );
}
