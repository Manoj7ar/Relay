import { Camera, Cpu, RotateCcw, Sparkles, Square, Volume2 } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { Card, IconButton } from '@/components/primitives';
import { StreamingText } from './StreamingText';
import { ConfidenceMoodRow } from './ConfidenceMoodRow';
import { InterpretationAlternates } from './InterpretationAlternates';
import { CameraToggle } from './CameraToggle';
import { CameraPreview } from './CameraPreview';
import { useSession } from '@/contexts/SessionContext';
import { useHaptics } from '@/hooks/useHaptics';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { cn } from '@/lib/cn';

export function TranscriptionCard() {
  const { state, acceptAlternate, dispatch, clearError } = useSession();
  const tts = useSpeechSynthesis();
  const haptics = useHaptics();
  const {
    currentInterpretation,
    isListening,
    isProcessing,
    visionOn,
    interimTranscript,
    lastError,
  } = state;

  const lastSpokenIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentInterpretation) return;
    if (lastSpokenIdRef.current === currentInterpretation.id) return;
    lastSpokenIdRef.current = currentInterpretation.id;
    haptics('tap');
    void tts.speak(currentInterpretation.primary, {
      lang: currentInterpretation.detectedLanguage,
    });
  }, [currentInterpretation, tts, haptics]);

  const placeholderTitle = isListening
    ? 'Listening…'
    : isProcessing
      ? 'Interpreting…'
      : 'Tap the mic to start';

  const liveText = useMemo(() => {
    if ((isListening || isProcessing) && interimTranscript) {
      return interimTranscript;
    }
    return null;
  }, [isListening, isProcessing, interimTranscript]);

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
              className="inline-flex min-h-[36px] items-center gap-1 rounded-full bg-[var(--danger)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm transition-[background-color,box-shadow,transform] duration-200 ease-smooth hover:brightness-110 hover:shadow-md active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
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
            onToggle={() => dispatch({ type: 'TOGGLE_VISION' })}
          />
        </div>
      </div>

      {visionOn ? (
        <div className="mt-1.5 shrink-0">
          <CameraPreview
            active={visionOn}
            compact
            onToggleOff={() => dispatch({ type: 'SET_VISION', value: false })}
          />
        </div>
      ) : null}

      <div className="my-1 flex min-h-0 flex-1 flex-col justify-center overflow-hidden py-1">
        {liveText ? (
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
            className="mt-1 line-clamp-2 border-t border-black/5 pt-1 text-sm italic leading-snug text-muted"
            dir="ltr"
            lang="en"
          >
            {currentInterpretation.translation}
          </p>
        ) : null}
      </div>

      <div className="shrink-0 space-y-1.5">
        {lastError ? (
          <div
            role="alert"
            className="flex items-start justify-between gap-2 rounded-xl2 border border-[var(--danger)]/30 bg-[var(--danger)]/[0.06] px-2.5 py-1.5 text-[11px] text-text"
          >
            <span className="min-w-0 leading-snug">{lastError}</span>
            <button
              type="button"
              onClick={clearError}
              className="shrink-0 rounded-full bg-black/5 px-3 py-1 text-[10px] font-medium transition-[background-color,transform] duration-200 ease-smooth hover:bg-black/10 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
            >
              Dismiss
            </button>
          </div>
        ) : null}
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
                  Gemma
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
        ) : !lastError ? (
          <p className="text-center text-xs text-muted">
            Your words appear here.
          </p>
        ) : null}
      </div>
    </Card>
  );
}
