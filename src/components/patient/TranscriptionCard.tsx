import {
  BookOpen,
  Camera,
  Cpu,
  RotateCcw,
  Sparkles,
  Square,
  ThumbsDown,
  ThumbsUp,
  Volume2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, IconButton } from '@/components/primitives';
import { DictionaryEntryFormModal } from '@/components/dictionary/DictionaryEntryFormModal';
import { InterpretationErrorCallout } from './InterpretationErrorCallout';
import { ConfidenceMoodRow } from './ConfidenceMoodRow';
import { InterpretationAlternates } from './InterpretationAlternates';
import { CameraToggle } from './CameraToggle';
import { CameraPreview } from './CameraPreview';
import { useSession } from '@/contexts/SessionContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useHaptics } from '@/hooks/useHaptics';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { cn } from '@/lib/cn';
import { getEntryById } from '@/lib/patientDictionary';
import type { DictionaryEntry } from '@/types/dictionary';

export function TranscriptionCard() {
  const { state, acceptAlternate, dispatch, clearError, undoLastInterpretation } =
    useSession();
  const { settings } = useSettings();
  const tts = useSpeechSynthesis();
  const haptics = useHaptics();
  const [saveOpen, setSaveOpen] = useState(false);
  const [matchedEntries, setMatchedEntries] = useState<DictionaryEntry[]>([]);
  const [matchesOpen, setMatchesOpen] = useState(false);
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);
  /** After voting, section fades out and stays hidden for this interpretation id. */
  const [feedbackSectionFading, setFeedbackSectionFading] = useState(false);
  const [feedbackSectionHidden, setFeedbackSectionHidden] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [undoNow, setUndoNow] = useState(() => Date.now());
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
      lang:
        currentInterpretation.ttsLang ??
        currentInterpretation.detectedLanguage,
    });
  }, [currentInterpretation, tts, haptics]);

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
    setFeedback(null);
    setFeedbackSectionFading(false);
    setFeedbackSectionHidden(false);
    setSaveNotice(null);
  }, [currentInterpretation?.id]);

  useEffect(() => {
    if (!saveNotice) return undefined;
    const id = window.setTimeout(() => setSaveNotice(null), 3200);
    return () => window.clearTimeout(id);
  }, [saveNotice]);

  useEffect(() => {
    if (!currentInterpretation) return undefined;
    setUndoNow(Date.now());
    const id = window.setInterval(() => setUndoNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [currentInterpretation?.id, currentInterpretation]);

  useEffect(() => {
    if (feedback !== 'yes' && feedback !== 'no') return undefined;
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fadeMs = reduceMotion ? 0 : 320;
    const fadeTimer = window.setTimeout(
      () => setFeedbackSectionFading(true),
      3000,
    );
    const hideTimer = window.setTimeout(() => {
      setFeedbackSectionHidden(true);
      setFeedbackSectionFading(false);
      setFeedback(null);
    }, 3000 + fadeMs);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [feedback]);

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

  const activeChannels = useMemo(() => {
    const ch = currentInterpretation?.contributingChannels ?? [];
    const channels: string[] = [];
    if (isListening || isProcessing || ch.includes('speech')) {
      channels.push('speech');
    }
    if (visionOn || ch.includes('camera')) {
      channels.push('camera');
    }
    if (ch.includes('symbols')) {
      channels.push('symbols');
    }
    if (ch.includes('gesture')) {
      channels.push('gesture');
    }
    return Array.from(new Set(channels));
  }, [currentInterpretation, isListening, isProcessing, visionOn]);

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
      <div className="flex shrink-0 items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
          <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden />
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

      {activeChannels.length > 1 ? (
        <div className="mt-1.5 shrink-0 rounded-xl2 border border-[var(--accent)]/20 bg-[var(--accent)]/[0.07] px-3 py-2 text-xs">
          <p className="font-semibold text-text">Compound input</p>
          <p className="mt-0.5 text-muted">
            Fusing {activeChannels.join(' + ')} into one intent.
          </p>
        </div>
      ) : null}

      <div className="my-2 flex min-h-0 flex-1 flex-col justify-center overflow-hidden py-2">
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
          <p
            role="status"
            className="mt-1 rounded-lg bg-black/[0.05] px-2 py-1 text-center text-[11px] text-muted"
          >
            Language uncertain — using mic attribution. Check both lines above.
          </p>
        ) : null}
      </div>

      <div className="shrink-0 space-y-1.5">
        {lastError ? (
          <InterpretationErrorCallout error={lastError} onDismiss={clearError} />
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
            {!feedbackSectionHidden ? (
              <div
                className={cn(
                  'rounded-xl2 border border-black/5 bg-black/[0.03] p-2',
                  'transition-opacity duration-300 ease-out motion-reduce:duration-150',
                  feedbackSectionFading &&
                    'pointer-events-none opacity-0 motion-reduce:opacity-0',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium">Was this right?</p>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      aria-pressed={feedback === 'yes'}
                      onClick={() => setFeedback('yes')}
                      className="inline-flex min-h-8 items-center gap-1 rounded-full px-3 text-[11px] font-medium hover:bg-black/5 aria-pressed:bg-[var(--accent)] aria-pressed:text-white"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" aria-hidden />
                      Yes
                    </button>
                    <button
                      type="button"
                      aria-pressed={feedback === 'no'}
                      onClick={() => setFeedback('no')}
                      className="inline-flex min-h-8 items-center gap-1 rounded-full px-3 text-[11px] font-medium hover:bg-black/5 aria-pressed:bg-[var(--danger)] aria-pressed:text-white"
                    >
                      <ThumbsDown className="h-3.5 w-3.5" aria-hidden />
                      No
                    </button>
                  </div>
                </div>
                {feedback === 'yes' ? (
                  <button
                    type="button"
                    onClick={() => setSaveOpen(true)}
                    className="mt-1.5 text-xs font-semibold text-[var(--accent)] underline"
                  >
                    Save this as a new patient signal
                  </button>
                ) : feedback === 'no' ? (
                  <p className="mt-1.5 text-xs text-muted">
                    Ask the patient or carer, then save the corrected meaning.
                  </p>
                ) : null}
              </div>
            ) : null}
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
            {(currentInterpretation.contributingChannels ?? []).length ? (
              <p className="text-[10px] text-muted">
                Channels:{' '}
                {currentInterpretation.contributingChannels
                  .map((channel) => channel.replace('_', ' '))
                  .join(', ')}
              </p>
            ) : null}
          </>
        ) : !lastError ? (
          <p className="text-center text-[13px] leading-relaxed text-muted/90">
            Your words appear here.
          </p>
        ) : null}
      </div>
      <DictionaryEntryFormModal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        title="Save new patient signal"
        initial={{
          modality:
            state.lastInputSnapshot?.contributingChannels.length &&
            state.lastInputSnapshot.contributingChannels.length > 1
              ? 'compound'
              : state.lastInputSnapshot?.symbolIds?.length
                ? 'symbol'
                : state.lastInputSnapshot?.imageDataUrl
                  ? 'gesture'
                  : 'partial_word',
          rawTranscript: state.lastInputSnapshot?.transcript,
          symbolIds: state.lastInputSnapshot?.symbolIds,
          imageDataUrl: state.lastInputSnapshot?.imageDataUrl,
          meaning: currentInterpretation?.primary,
          contextTags: state.lastInputSnapshot?.contributingChannels ?? [],
          confirmedBy: 'self',
        }}
      />
    </Card>
  );
}
