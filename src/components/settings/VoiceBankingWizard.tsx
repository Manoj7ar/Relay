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
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Voice banking</p>
        <span className="text-xs text-muted">Step {step + 1} of 4</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-[width]"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {step === 0 && (
        <div className="space-y-2">
          <h4 className="text-lg font-semibold tracking-tight">
            Preserve your voice.
          </h4>
          <p className="text-sm text-muted">
            Relay can speak in your own voice, even as speech becomes harder.
            Record a few short phrases now — we will use them to train a
            personal voice clone on-device.
          </p>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold tracking-tight">
            Record {TARGET} phrases.
          </h4>
          <p className="text-sm text-muted">
            Recorded{' '}
            <span className="font-semibold">
              {voiceBanking.recordedPhrases}
            </span>{' '}
            of {TARGET}.
          </p>
          <PillButton
            size="lg"
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
        <div className="space-y-3">
          <h4 className="text-lg font-semibold tracking-tight">
            Preview your cloned voice
          </h4>
          <p className="text-sm text-muted">
            {voiceBanking.recordedPhrases >= TARGET
              ? 'Your personal voice clone is ready.'
              : 'Finish step 2 to unlock the preview.'}
          </p>
          <PillButton
            size="lg"
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
        <div className="space-y-2 text-sm text-muted">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" aria-hidden />
          <h4 className="text-lg font-semibold text-text tracking-tight">
            You're set up.
          </h4>
          <p>
            Your voice clone will be used for spoken replies. You can retrain
            or replace it any time from this screen.
          </p>
        </div>
      )}

      <div className="flex justify-between">
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
