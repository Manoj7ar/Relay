import { useState } from 'react';
import { CheckCircle2, Mic, Play, Square } from 'lucide-react';
import { Card, PillButton } from '@/components/primitives';
import { useSettings } from '@/contexts/SettingsContext';

const TARGET = 5;

export function VoiceBankingWizard() {
  const { settings, dispatch } = useSettings();
  const { voiceBanking } = settings;
  const [recording, setRecording] = useState(false);

  const step = voiceBanking.currentStep;
  const progress = Math.min(1, (step + 1) / 4);

  const next = () =>
    dispatch({
      type: 'VOICE_BANKING',
      patch: { currentStep: Math.min(3, step + 1) as 0 | 1 | 2 | 3 },
    });
  const back = () =>
    dispatch({
      type: 'VOICE_BANKING',
      patch: { currentStep: Math.max(0, step - 1) as 0 | 1 | 2 | 3 },
    });

  const recordOne = () => {
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      dispatch({
        type: 'VOICE_BANKING',
        patch: {
          recordedPhrases: Math.min(TARGET, voiceBanking.recordedPhrases + 1),
        },
      });
    }, 1200);
  };

  return (
    <Card padded={false} className="flex h-full min-h-0 flex-col gap-2 overflow-hidden p-3">
      <div className="flex shrink-0 items-center justify-between">
        <p className="text-xs font-semibold">Voice banking</p>
        <span className="text-[10px] text-muted">Step {step + 1}/4</span>
      </div>
      <div className="h-1 w-full shrink-0 overflow-hidden rounded-full bg-black/10">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-[width]"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {step === 0 && (
        <div className="min-h-0 space-y-1.5">
          <h4 className="text-sm font-semibold tracking-tight">
            Preserve your voice
          </h4>
          <p className="line-clamp-4 text-xs text-muted">
            Relay can speak in your own voice. Record short phrases to train a
            local voice clone.
          </p>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold tracking-tight">
            Record {TARGET} phrases
          </h4>
          <p className="text-xs text-muted">
            <span className="font-semibold">
              {voiceBanking.recordedPhrases}
            </span>{' '}
            / {TARGET}
          </p>
          <PillButton
            size="md"
            variant={recording ? 'danger' : 'accent'}
            onClick={recordOne}
            disabled={
              recording || voiceBanking.recordedPhrases >= TARGET
            }
            leftIcon={
              recording ? (
                <Square className="h-5 w-5" aria-hidden />
              ) : (
                <Mic className="h-5 w-5" aria-hidden />
              )
            }
          >
            {recording
              ? 'Recording…'
              : voiceBanking.recordedPhrases >= TARGET
                ? 'All phrases recorded'
                : 'Record next phrase'}
          </PillButton>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold tracking-tight">
            Preview voice
          </h4>
          <p className="line-clamp-2 text-xs text-muted">
            {voiceBanking.recordedPhrases >= TARGET
              ? 'Clone ready.'
              : 'Finish recording first.'}
          </p>
          <PillButton
            size="md"
            variant="glass"
            leftIcon={<Play className="h-5 w-5" aria-hidden />}
            disabled={voiceBanking.recordedPhrases < TARGET}
            onClick={() =>
              dispatch({
                type: 'VOICE_BANKING',
                patch: { cloneReady: true },
              })
            }
          >
            Play preview
          </PillButton>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-1 text-xs text-muted">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden />
          <h4 className="text-sm font-semibold text-text tracking-tight">
            You&apos;re set up
          </h4>
          <p className="line-clamp-3">
            Voice clone will be used for replies. Retrain anytime here.
          </p>
        </div>
      )}

      <div className="mt-auto flex shrink-0 justify-between gap-2 pt-1">
        <PillButton
          size="sm"
          variant="glass"
          disabled={step === 0}
          onClick={back}
        >
          Back
        </PillButton>
        <PillButton
          size="sm"
          variant="accent"
          onClick={next}
          disabled={step === 3 || (step === 1 && voiceBanking.recordedPhrases < TARGET)}
        >
          {step === 3 ? 'Done' : 'Next'}
        </PillButton>
      </div>
    </Card>
  );
}
