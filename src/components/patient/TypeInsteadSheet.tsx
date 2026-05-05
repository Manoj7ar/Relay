import { useEffect, useId, useRef, useState } from 'react';
import { ChevronUp, Keyboard, Send } from 'lucide-react';
import { Card, PillButton } from '@/components/primitives';
import { useSession } from '@/contexts/SessionContext';
import { useSettings } from '@/contexts/SettingsContext';
import { pickSourceLanguageHint } from '@/lib/transcriptSpeakerHint';
import { cn } from '@/lib/cn';

/**
 * Manual text fallback when recording is unavailable or the user prefers to type.
 * Expands **inline** under the mic (no modal) so the rest
 * of the home screen stays visible while composing.
 */
export function TypeInsteadSheet() {
  const panelId = useId();
  const [expanded, setExpanded] = useState(false);
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { submit, state } = useSession();
  const { settings } = useSettings();

  const collapse = () => {
    setExpanded(false);
    setValue('');
    setSubmitting(false);
  };

  useEffect(() => {
    if (!expanded) return;
    const t = window.setTimeout(() => textareaRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') collapse();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);

  const handleSubmit = async () => {
    const trimmed = value.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      const languageHint = pickSourceLanguageHint(
        trimmed,
        settings.language.primaryLanguage,
        settings.language.caregiverLanguage,
        state.sessionInferredSpeaker,
      );
      await submit({
        inputType: 'text',
        transcript: trimmed,
        language: languageHint,
        patientLanguage: settings.language.primaryLanguage,
        caregiverLanguage: settings.language.caregiverLanguage,
      });
      collapse();
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <PillButton
        type="button"
        id={`${panelId}-trigger`}
        aria-expanded={expanded}
        aria-controls={panelId}
        size="lg"
        variant="glass"
        fullWidth
        className={cn('relay-home-pill')}
        onClick={() => setExpanded((v) => !v)}
        leftIcon={
          expanded ? (
            <ChevronUp className="h-5 w-5" aria-hidden />
          ) : (
            <Keyboard className="h-5 w-5" aria-hidden />
          )
        }
        aria-label={
          expanded
            ? 'Hide typing area'
            : 'Type a message instead of speaking'
        }
      >
        {expanded ? 'Hide typing' : 'Type instead'}
      </PillButton>

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-base ease-out motion-reduce:transition-none',
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <Card
            id={panelId}
            role="region"
            aria-labelledby={`${panelId}-trigger`}
            variant="glass-strong"
            padded={false}
            className={cn(
              'mt-2 border border-white/50 p-2.5 shadow-sm',
              expanded &&
                'motion-safe:animate-sheet-in motion-reduce:animate-none',
            )}
          >
            <p className="mb-2 text-[11px] leading-snug text-muted">
              Same interpretation path as voice. Press{' '}
              <kbd className="rounded bg-black/5 px-1 font-mono text-[10px]">
                Enter
              </kbd>{' '}
              to send,{' '}
              <kbd className="rounded bg-black/5 px-1 font-mono text-[10px]">
                Esc
              </kbd>{' '}
              to hide.
            </p>
            {state.pendingImage ? (
              <p className="mb-2 flex items-start gap-1.5 rounded-lg bg-[var(--accent)]/[0.08] px-2 py-1.5 text-[11px] leading-snug text-text">
                <span className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" aria-hidden />
                Your typed message is sent{' '}
                <strong className="font-semibold">together with the photo</strong> you
                captured above.
              </p>
            ) : null}
            <textarea
              ref={textareaRef}
              rows={2}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="What would you like to say?"
              className="control-textarea max-h-[min(28vh,200px)] resize-y p-2.5 text-[15px] leading-snug backdrop-blur-sm placeholder:text-muted/80"
              aria-label="Your message"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.stopPropagation();
                  collapse();
                  return;
                }
                if (e.key !== 'Enter') return;
                // Shift+Enter = new line; Enter alone sends
                if (e.shiftKey) return;
                e.preventDefault();
                void handleSubmit();
              }}
            />
            <div className="mt-2 flex justify-end">
              <PillButton
                size="sm"
                variant="accent"
                disabled={!value.trim() || submitting}
                onClick={handleSubmit}
                leftIcon={<Send className="h-3.5 w-3.5" aria-hidden />}
              >
                {submitting ? 'Sending…' : 'Send'}
              </PillButton>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
