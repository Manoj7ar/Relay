import {
  BookOpen,
  Camera,
  ImageIcon,
  RotateCcw,
  Square,
  Volume2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, IconButton } from '@/components/primitives';
import { InterpretationErrorCallout } from './InterpretationErrorCallout';
import { ConfidenceMoodRow } from './ConfidenceMoodRow';
import { BilingualCoachStrip } from './BilingualCoachStrip';
import { TelemetryPill } from './TelemetryPill';
import { CameraToggle } from './CameraToggle';
import { CameraPreview } from './CameraPreview';
import { useSession } from '@/contexts/SessionContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useHaptics } from '@/hooks/useHaptics';
import { useTranscriptStack } from '@/hooks/useTranscriptStack';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { cn } from '@/lib/cn';
import { readbackTextAndLang } from '@/lib/ttsReadback';
import { getEntryById } from '@/lib/patientDictionary';
import type { DictionaryEntry } from '@/types/dictionary';

export function TranscriptionCard() {
  const {
    state,
    dispatch,
    clearError,
    undoLastInterpretation,
    setPendingImage,
  } = useSession();
  const { settings } = useSettings();
  const tts = useSpeechSynthesis();
  const haptics = useHaptics();
  const [matchedEntries, setMatchedEntries] = useState<DictionaryEntry[]>([]);
  const [matchesOpen, setMatchesOpen] = useState(false);
  const [undoNow, setUndoNow] = useState(() => Date.now());
  const {
    currentInterpretation,
    isListening,
    isProcessing,
    visionOn,
    interimTranscript,
    lastError,
  } = state;

  const sessionTokensUsed = useMemo(() => {
    return state.history.reduce((acc, h) => {
      const t = h.telemetry;
      if (!t) return acc;
      if (t.totalTokens != null) return acc + t.totalTokens;
      if (t.promptTokens != null && t.completionTokens != null) {
        return acc + t.promptTokens + t.completionTokens;
      }
      if (t.completionTokens != null) return acc + t.completionTokens;
      if (t.promptTokens != null) return acc + t.promptTokens;
      return acc;
    }, 0);
  }, [state.history]);

  const lastSpokenIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentInterpretation) return;
    if (lastSpokenIdRef.current === currentInterpretation.id) return;
    lastSpokenIdRef.current = currentInterpretation.id;
    haptics('tap');
    const { text, lang } = readbackTextAndLang(
      currentInterpretation,
      settings.language.primaryLanguage,
      settings.language.caregiverLanguage,
    );
    void tts.speak(text, {
      lang,
      voiceURI: settings.language.ttsVoiceUri,
    });
  }, [
    currentInterpretation,
    tts,
    haptics,
    settings.language.primaryLanguage,
    settings.language.caregiverLanguage,
    settings.language.ttsVoiceUri,
  ]);

  const partnerSubtitleLang = useMemo(() => {
    const interp = currentInterpretation;
    if (!interp?.translation) return undefined;
    const patientLine = interp.patientLanguageText ?? interp.primary;
    return interp.primary === patientLine
      ? settings.language.caregiverLanguage
      : settings.language.primaryLanguage;
  }, [currentInterpretation, settings.language]);

  useEffect(() => {
    let cancelled = false;
    const ids = currentInterpretation?.dictionaryMatchIds ?? [];
    if (!ids.length) {
      setMatchedEntries([]);
      setMatchesOpen(false);
      return;
    }
    void Promise.all(ids.map((id) => getEntryById(id))).then((entries) => {
      if (!cancelled) {
        setMatchedEntries(
          entries.filter((entry): entry is DictionaryEntry => Boolean(entry)),
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [currentInterpretation?.dictionaryMatchIds, currentInterpretation?.id]);

  useEffect(() => {
    if (!currentInterpretation) return undefined;
    setUndoNow(Date.now());
    const id = window.setInterval(() => setUndoNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [currentInterpretation?.id, currentInterpretation]);

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

  const transcriptStack = useTranscriptStack({
    interpretation: currentInterpretation,
    historyLength: state.history.length,
    isListening,
    isProcessing,
  });

  const showTranscriptCarousel =
    Boolean(transcriptStack.curr) &&
    !liveText &&
    !isListening &&
    !isProcessing;

  const canUndoLast =
    currentInterpretation && undoNow - currentInterpretation.ts <= 8000;

  return (
    <Card
      variant="solid"
      padded={false}
      className={cn(
        'relative flex min-h-0 flex-1 flex-col justify-between overflow-hidden',
        'px-4 pb-3 pt-3 sm:px-5 sm:pb-4 sm:pt-3.5',
      )}
    >
      <div className="flex shrink-0 items-start justify-end gap-2">
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

      {state.pendingImage ? (
        <div
          className="mt-1.5 shrink-0 rounded-xl2 border border-[var(--accent)]/20 bg-white/80 px-2.5 py-2 shadow-sm"
          role="status"
        >
          <div className="flex gap-2">
            <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-black/10 ring-1 ring-black/10">
              <img
                src={state.pendingImage.dataUrl}
                alt="Captured photo attached to your next message"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-text">
                <ImageIcon className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                Photo attached
              </p>
              <p className="text-[10px] leading-snug text-muted">
                Speak with the mic or type below. Relay sends{' '}
                <strong className="font-semibold text-text">this photo and your words</strong>{' '}
                together to the model.
              </p>
            </div>
            <IconButton
              variant="ghost"
              size="sm"
              icon={<X className="h-5 w-5" aria-hidden />}
              label="Remove attached photo"
              className="h-10 w-10 shrink-0 self-start"
              onClick={() => setPendingImage(null)}
            />
          </div>
        </div>
      ) : null}

      <div className="relative my-2 flex min-h-0 flex-1 flex-col justify-center overflow-hidden py-2">
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
        ) : showTranscriptCarousel && transcriptStack.curr ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {transcriptStack.departing ? (
              <div
                key={`departing-${transcriptStack.departing.id}`}
                className="motion-safe:animate-transcript-out motion-reduce:animate-none shrink-0"
              >
                <p
                  className="line-clamp-2 text-sm font-medium leading-snug text-muted/70"
                  dir="auto"
                  lang={transcriptStack.departing.detectedLanguage}
                >
                  {transcriptStack.departing.primary}
                </p>
              </div>
            ) : null}
            {transcriptStack.prev ? (
              <div
                key={`prev-${transcriptStack.prev.id}`}
                className="motion-safe:animate-transcript-demote motion-reduce:animate-none shrink-0 border-b border-black/5 pb-1"
              >
                <span className="sr-only">Previously: </span>
                <div className="flex min-w-0 items-start gap-1.5">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted"
                    aria-hidden
                  />
                  <p
                    className="line-clamp-2 min-w-0 text-sm font-medium leading-snug text-muted"
                    dir="auto"
                    lang={transcriptStack.prev.detectedLanguage}
                  >
                    {transcriptStack.prev.primary}
                  </p>
                </div>
              </div>
            ) : null}
            <div className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden">
              <p
                key={transcriptStack.curr.id}
                className="motion-safe:animate-slide-up motion-reduce:animate-none line-clamp-4 text-[clamp(1.05rem,4.2vw,1.5rem)] font-semibold leading-snug"
                dir="auto"
                lang={transcriptStack.curr.detectedLanguage}
              >
                {transcriptStack.curr.primary}
              </p>
            </div>
          </div>
        ) : (
          <p className="line-clamp-3 text-center text-[clamp(1rem,3.8vw,1.2rem)] font-medium leading-snug text-muted">
            {placeholderTitle}
          </p>
        )}

        {currentInterpretation?.translation ? (
          <p
            className="mt-1 line-clamp-2 border-t border-black/5 pt-1 text-sm italic leading-snug text-muted"
            dir="auto"
            lang={partnerSubtitleLang ?? 'en'}
          >
            {currentInterpretation.translation}
          </p>
        ) : null}
        {currentInterpretation?.bilingualAmbiguous ? (
          <BilingualCoachStrip
            interpretationId={currentInterpretation.id}
            patientLanguage={settings.language.primaryLanguage}
            caregiverLanguage={settings.language.caregiverLanguage}
            primaryLine={currentInterpretation.primary}
            partnerLine={currentInterpretation.translation}
          />
        ) : null}
      </div>

      <div className="mt-8 shrink-0 space-y-1.5 sm:mt-10">
        {lastError ? (
          <InterpretationErrorCallout error={lastError} onDismiss={clearError} />
        ) : null}
        {isProcessing && state.requestStartedAt != null ? (
          <TelemetryPill
            processing
            startedAt={state.requestStartedAt}
            sessionTokensUsed={sessionTokensUsed}
          />
        ) : currentInterpretation &&
          (currentInterpretation.telemetry != null ||
            currentInterpretation.latencyMs != null) ? (
          <TelemetryPill
            processing={false}
            startedAt={null}
            telemetry={currentInterpretation.telemetry ?? undefined}
            fallbackLatencyMs={
              currentInterpretation.telemetry
                ? undefined
                : currentInterpretation.latencyMs
            }
            sessionTokensUsed={sessionTokensUsed}
          />
        ) : null}
        {currentInterpretation ? (
          <>
            {(currentInterpretation.dictionaryMatchIds ?? []).length ? (
              <div className="rounded-xl2 border border-[var(--accent)]/25 bg-[var(--accent)]/[0.08] p-2 text-xs">
                <button
                  type="button"
                  onClick={() => setMatchesOpen((open) => !open)}
                  className="flex w-full items-center justify-between gap-2 text-left font-semibold text-text"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" aria-hidden />
                    Learned from this patient
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-muted">
                    {matchedEntries.length ||
                      (currentInterpretation.dictionaryMatchIds ?? []).length}{' '}
                    match
                  </span>
                </button>
                {matchesOpen ? (
                  <div className="mt-2 space-y-1.5">
                    {matchedEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-xl bg-white/50 px-2 py-1.5"
                      >
                        <p className="font-medium">{entry.meaning}</p>
                        <p className="text-[11px] text-muted">
                          {entry.rawTranscript
                            ? `"${entry.rawTranscript}" · `
                            : ''}
                          confirmed {entry.confirmations}x
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            <div
              className={cn(
                'flex min-h-8 w-full min-w-0 items-center gap-2',
                tts.supported && tts.lastSpokenText
                  ? 'justify-between'
                  : 'justify-start',
              )}
            >
              <ConfidenceMoodRow
                confidence={currentInterpretation.confidence}
                urgency={currentInterpretation.urgency}
                mood={currentInterpretation.mood}
                compact
                className="min-w-0 justify-start"
              />
              {tts.supported && tts.lastSpokenText ? (
                <IconButton
                  size="sm"
                  variant="glass"
                  className="!h-7 !w-7 shrink-0 self-center"
                  onClick={() =>
                    tts.replay({
                      voiceURI: settings.language.ttsVoiceUri ?? undefined,
                    })
                  }
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
            </div>
            {canUndoLast ? (
              <button
                type="button"
                onClick={() => {
                  haptics('tap');
                  void undoLastInterpretation();
                }}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-[var(--danger)]/25 bg-[var(--danger)]/[0.06] px-3 text-xs font-semibold text-[var(--danger)] transition-[background-color,transform] duration-200 ease-smooth hover:bg-[var(--danger)]/[0.1] active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                Not what I meant
              </button>
            ) : null}
          </>
        ) : !lastError ? (
          <p className="text-center text-[13px] leading-relaxed text-muted/90">
            Your words appear here.
          </p>
        ) : null}
      </div>
    </Card>
  );
}
