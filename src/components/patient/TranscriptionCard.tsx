import { Camera, Cpu, RotateCcw, Sparkles, Square, Volume2 } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { Card, IconButton } from '@/components/primitives';
import { StreamingText } from './StreamingText';
import { ConfidenceMoodRow } from './ConfidenceMoodRow';
import { InterpretationAlternates } from './InterpretationAlternates';
import { CameraToggle } from './CameraToggle';
import { CameraPreview } from './CameraPreview';
import { useSession } from '@/contexts/SessionContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useJudgeDemo } from '@/contexts/JudgeDemoContext';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { cn } from '@/lib/cn';

export function TranscriptionCard() {
  const { state, acceptAlternate, dispatch } = useSession();
  const { settings } = useSettings();
  const judge = useJudgeDemo();
  const tts = useSpeechSynthesis();
  const {
    currentInterpretation,
    isListening,
    isProcessing,
    visionOn,
    interimTranscript,
  } = state;
  const demoMode = settings.demoMode;
  const showJudgeFragment =
    judge.phase === 'fragment' && Boolean(judge.fragmentDisplay);

  const lastSpokenIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentInterpretation) return;
    if (judge.phase !== 'idle' && judge.phase !== 'outcome') return;
    if (demoMode) return;
    if (lastSpokenIdRef.current === currentInterpretation.id) return;
    lastSpokenIdRef.current = currentInterpretation.id;
    void tts.speak(currentInterpretation.primary, {
      lang: currentInterpretation.detectedLanguage,
    });
  }, [currentInterpretation, demoMode, judge.phase, tts]);

  const placeholderTitle = showJudgeFragment
    ? 'Fragmented input (simulated)'
    : isListening
      ? 'Listening…'
      : isProcessing
        ? 'Interpreting…'
        : 'Tap the mic to start';

  const liveText = useMemo(() => {
    if (isListening && interimTranscript) return interimTranscript;
    return null;
  }, [isListening, interimTranscript]);

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
          {tts.speaking ? (
            <button
              type="button"
              onClick={tts.cancel}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--danger)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white"
              aria-label="Stop speaking"
            >
              <Square className="h-3 w-3 fill-current" /> Stop
            </button>
          ) : null}
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

      {visionOn && !demoMode ? (
        <div className="mt-1.5 shrink-0">
          <CameraPreview
            active={visionOn}
            compact
            onToggleOff={() => dispatch({ type: 'SET_VISION', value: false })}
          />
        </div>
      ) : null}

      <div className="my-1 flex min-h-0 flex-1 flex-col justify-center overflow-hidden py-1">
        {showJudgeFragment && judge.fragmentDisplay ? (
          <p className="line-clamp-4 text-center text-[clamp(1.1rem,4.2vw,1.5rem)] font-semibold leading-snug text-text">
            {judge.fragmentDisplay}
          </p>
        ) : liveText ? (
          <p
            aria-live="polite"
            className="line-clamp-4 text-center text-[clamp(1.05rem,4.2vw,1.5rem)] font-medium italic leading-snug text-muted"
          >
            {liveText}
            <span
              aria-hidden
              className="ms-1 inline-block h-[0.9em] w-[0.5ch] translate-y-[2px] animate-pulse rounded-[2px] bg-[var(--accent)]/80"
            />
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
              <span className="flex items-center gap-2">
                <span className="shrink-0 tabular-nums">
                  {currentInterpretation.latencyMs} ms
                </span>
                {tts.supported && tts.lastSpokenText ? (
                  <IconButton
                    size="sm"
                    variant="glass"
                    className="!h-7 !w-7"
                    onClick={tts.replay}
                    disabled={tts.speaking}
                    label="Replay spoken message"
                    icon={
                      tts.speaking ? (
                        <Volume2 className="h-3.5 w-3.5" aria-hidden />
                      ) : (
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                      )
                    }
                  />
                ) : null}
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
