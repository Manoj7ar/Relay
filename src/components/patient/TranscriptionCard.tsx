import { Camera, Cpu, Sparkles } from 'lucide-react';
import { Card } from '@/components/primitives';
import { StreamingText } from './StreamingText';
import { ConfidenceMoodRow } from './ConfidenceMoodRow';
import { InterpretationAlternates } from './InterpretationAlternates';
import { CameraToggle } from './CameraToggle';
import { useSession } from '@/contexts/SessionContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useJudgeDemo } from '@/contexts/JudgeDemoContext';
import { cn } from '@/lib/cn';

export function TranscriptionCard() {
  const { state, acceptAlternate, dispatch } = useSession();
  const { settings } = useSettings();
  const judge = useJudgeDemo();
  const { currentInterpretation, isListening, isProcessing, visionOn } = state;
  const demoMode = settings.demoMode;
  const showJudgeFragment =
    judge.phase === 'fragment' && Boolean(judge.fragmentDisplay);

  const placeholderTitle = showJudgeFragment
    ? 'Fragmented input (simulated)'
    : isListening
      ? 'Listening…'
      : isProcessing
        ? 'Interpreting…'
        : 'Tap the mic to start';

  return (
    <Card
      variant="glass-strong"
      padded={false}
      className={cn(
        'relative flex min-h-0 flex-1 flex-col justify-between overflow-hidden',
        'px-3 pb-2 pt-2',
      )}
    >
      <div className="flex shrink-0 items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted">
          <Sparkles className="h-3 w-3" aria-hidden />
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
            disabled={demoMode}
            onToggle={() => dispatch({ type: 'TOGGLE_VISION' })}
          />
        </div>
      </div>

      <div className="my-1 flex min-h-0 flex-1 flex-col justify-center overflow-hidden py-1">
        {showJudgeFragment && judge.fragmentDisplay ? (
          <p className="line-clamp-4 text-center text-[clamp(1.1rem,4.2vw,1.5rem)] font-semibold leading-snug text-text">
            {judge.fragmentDisplay}
          </p>
        ) : currentInterpretation ? (
          <div className="min-h-0 overflow-hidden">
            <StreamingText
              text={currentInterpretation.primary}
              className="line-clamp-4 text-[clamp(1.05rem,4.2vw,1.5rem)] font-semibold leading-snug"
            />
          </div>
        ) : (
          <p className="line-clamp-2 text-center text-[clamp(0.95rem,3.5vw,1.15rem)] font-medium text-muted">
            {placeholderTitle}
          </p>
        )}

        {currentInterpretation?.translation ? (
          <p
            className="mt-1 line-clamp-2 text-xs leading-snug text-muted"
            dir="auto"
          >
            {currentInterpretation.translation}
          </p>
        ) : null}
      </div>

      <div className="shrink-0 space-y-1.5">
        {currentInterpretation ? (
          <>
            <ConfidenceMoodRow
              confidence={currentInterpretation.confidence}
              urgency={currentInterpretation.urgency}
              mood={currentInterpretation.mood}
              compact
            />
            <InterpretationAlternates
              alternates={currentInterpretation.alternates}
              onSelect={acceptAlternate}
            />
            <div className="flex items-center justify-between gap-2 text-[10px] text-muted">
              <span className="inline-flex min-w-0 items-center gap-1 truncate">
                <Cpu className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">
                  {currentInterpretation.model}
                  {currentInterpretation.visionUsed ? ' · vision' : ''}
                </span>
              </span>
              <span className="shrink-0 tabular-nums">
                {currentInterpretation.latencyMs} ms
              </span>
            </div>
          </>
        ) : showJudgeFragment ? (
          <p className="text-center text-xs text-muted">
            Model tier and confidence fill in after the interpret step.
          </p>
        ) : (
          <p className="text-center text-xs text-muted">
            Your words appear here.
          </p>
        )}
      </div>
    </Card>
  );
}
