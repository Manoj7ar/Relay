import { useState } from 'react';
import { Keyboard, Send } from 'lucide-react';
import { Modal, PillButton } from '@/components/primitives';
import { useSession } from '@/contexts/SessionContext';
import { useSettings } from '@/contexts/SettingsContext';

/**
 * Manual text fallback for when SpeechRecognition is unsupported or the
 * user prefers to type. Always available beneath the mic button and in
 * demo mode. Uses the exact same `submit()` path as speech input so the
 * interpretation -> confirm -> TTS -> log loop behaves identically.
 */
export function TypeInsteadSheet() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { submit } = useSession();
  const { settings } = useSettings();

  const close = () => {
    setOpen(false);
    setValue('');
    setSubmitting(false);
  };

  const handleSubmit = async () => {
    const trimmed = value.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await submit({
        inputType: 'text',
        transcript: trimmed,
        language: settings.language.primaryLanguage,
      });
      close();
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mx-auto flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1 text-xs font-medium text-muted shadow-sm backdrop-blur-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        aria-label="Type a message instead of speaking"
      >
        <Keyboard className="h-3.5 w-3.5" aria-hidden />
        Type instead
      </button>

      <Modal
        open={open}
        onClose={close}
        title="Type a message"
        fullScreen={false}
        className="px-4 pb-4"
        labelledBy="type-instead-title"
      >
        <div className="px-2">
          <p className="mb-3 text-sm text-muted">
            Works even when speech input is blocked or unsupported. Uses the
            same interpretation pipeline as voice.
          </p>
          <textarea
            autoFocus
            rows={3}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="What would you like to say?"
            className="w-full resize-none rounded-xl2 border border-black/10 bg-white/90 p-3 text-base text-text focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
            aria-label="Your message"
            onKeyDown={(e) => {
              if (
                (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) ||
                (e.key === 'Enter' && !e.shiftKey)
              ) {
                e.preventDefault();
                void handleSubmit();
              }
            }}
          />
          <div className="mt-3 flex justify-end">
            <PillButton
              size="md"
              variant="accent"
              disabled={!value.trim() || submitting}
              onClick={handleSubmit}
              leftIcon={<Send className="h-4 w-4" aria-hidden />}
            >
              {submitting ? 'Sending…' : 'Send'}
            </PillButton>
          </div>
        </div>
      </Modal>
    </>
  );
}
