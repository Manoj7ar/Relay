import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { StepWelcome } from '@/components/onboarding/StepWelcome';
import { StepIdentity } from '@/components/onboarding/StepIdentity';
import { StepCondition } from '@/components/onboarding/StepCondition';
import { StepVoice } from '@/components/onboarding/StepVoice';
import { StepLangCaregiver } from '@/components/onboarding/StepLangCaregiver';
import { StepPhrases } from '@/components/onboarding/StepPhrases';
import { StepA11yDone } from '@/components/onboarding/StepA11yDone';
import { useSettings } from '@/contexts/SettingsContext';
import { useViewportShell } from '@/hooks/useViewportShell';
import { useSession } from '@/contexts/SessionContext';
import { seedOnboardingDictionary } from '@/services/onboardingDictionarySeeder';

type StepId =
  | 'welcome'
  | 'identity'
  | 'condition'
  | 'voice'
  | 'lang-caregiver'
  | 'phrases'
  | 'a11y-done';

const STEPS: StepId[] = [
  'welcome',
  'identity',
  'condition',
  'voice',
  'lang-caregiver',
  'phrases',
  'a11y-done',
];

export function OnboardingPage() {
  useViewportShell();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { settings, dispatch } = useSettings();
  const { state } = useSession();

  const mode = params.get('mode') === 'edit' ? 'edit' : 'first-run';
  const startStep = params.get('step');
  const initialIndex = useMemo(() => {
    const idx = STEPS.findIndex((s) => s === startStep);
    return idx >= 0 ? idx : 0;
  }, [startStep]);

  const [stepIndex, setStepIndex] = useState(initialIndex);
  const step = STEPS[stepIndex];

  useEffect(() => {
    const el = document.scrollingElement ?? document.documentElement;
    el.scrollTop = 0;
  }, [stepIndex]);

  const finish = useCallback(() => {
    dispatch({ type: 'COMPLETE_ONBOARDING' });
    if (settings.relayPowerOn) {
      void seedOnboardingDictionary({
        profile: settings.profile,
        patientLanguage: settings.language.primaryLanguage,
        caregiverLanguage: settings.language.caregiverLanguage,
      });
    }
    navigate('/', { replace: true });
  }, [dispatch, navigate, settings]);

  const saveAndExit = useCallback(() => {
    if (!settings.onboardingCompletedAt) {
      dispatch({ type: 'COMPLETE_ONBOARDING' });
    }
    navigate('/settings', { replace: true });
  }, [dispatch, navigate, settings.onboardingCompletedAt]);

  const goNext = useCallback(() => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((i) => i + 1);
      return;
    }
    if (mode === 'edit') saveAndExit();
    else finish();
  }, [finish, mode, saveAndExit, stepIndex]);

  const goBack = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const profile = settings.profile;

  const continueDisabled = (() => {
    if (step === 'welcome') return profile.setupRole === 'unknown';
    if (step === 'identity') return profile.displayName.trim().length === 0;
    return false;
  })();

  const title = (() => {
    switch (step) {
      case 'welcome':
        return "Let's set up Relay";
      case 'identity':
        return profile.setupRole === 'caregiver'
          ? 'Who is Relay for?'
          : 'Tell us a bit about you';
      case 'condition':
        return 'Any speech pattern we should know?';
      case 'voice':
        return 'Voice calibration';
      case 'lang-caregiver':
        return 'Languages & caregiver';
      case 'phrases':
        return 'Your go-to phrases';
      case 'a11y-done':
        return 'Comfort & finish';
    }
  })();

  const description = (() => {
    switch (step) {
      case 'welcome':
        return 'Takes about two minutes. Everything stays on this device.';
      case 'identity':
        return 'Names help Relay greet the right person on the home screen.';
      case 'condition':
        return 'Helps the on-device model read intent a little better.';
      case 'voice':
        return 'Optional — record four short phrases so Relay learns how common words sound in this voice.';
      case 'lang-caregiver':
        return 'Pick primary and caregiver languages, plus who supports day-to-day care.';
      case 'phrases':
        return 'Common phrases help Ollama understand how you usually speak.';
      case 'a11y-done':
        return 'Two quick display toggles, then you are all set.';
    }
  })();

  const skip = (() => {
    if (step === 'voice') return () => goNext();
    if (step === 'phrases') return () => goNext();
    if (step === 'condition') return () => goNext();
    return undefined;
  })();

  return (
    <div
      dir={state.direction}
      className="relative mx-auto flex h-full min-h-0 w-full max-w-mobile flex-col overflow-hidden"
    >
      <OnboardingShell
        title={title}
        description={description}
        stepIndex={stepIndex}
        stepCount={STEPS.length}
        onBack={stepIndex > 0 ? goBack : undefined}
        onContinue={goNext}
        continueDisabled={continueDisabled}
        continueLabel={
          step === 'a11y-done'
            ? mode === 'edit'
              ? 'Save & exit'
              : 'Start Relay'
            : undefined
        }
        isFinalStep={step === 'a11y-done'}
        onSkip={skip}
        skipLabel={skip ? 'Skip this step' : undefined}
      >
        {step === 'welcome' ? (
          <StepWelcome
            setupRole={profile.setupRole}
            onChange={(role) =>
              dispatch({ type: 'SET_SETUP_ROLE', value: role })
            }
          />
        ) : null}

        {step === 'identity' ? (
          <StepIdentity
            setupRole={profile.setupRole}
            profile={{
              displayName: profile.displayName,
              fullName: profile.fullName,
              pronouns: profile.pronouns,
            }}
            onField={(field, value) =>
              dispatch({ type: 'SET_PROFILE_FIELD', field, value })
            }
          />
        ) : null}

        {step === 'condition' ? (
          <StepCondition
            setupRole={profile.setupRole}
            condition={profile.condition}
            detail={profile.conditionDetail}
            onCondition={(value) =>
              dispatch({
                type: 'SET_PROFILE_FIELD',
                field: 'condition',
                value,
              })
            }
            onDetail={(value) =>
              dispatch({
                type: 'SET_PROFILE_FIELD',
                field: 'conditionDetail',
                value,
              })
            }
          />
        ) : null}

        {step === 'voice' ? (
          <StepVoice
            setupRole={profile.setupRole}
            lang={settings.language.primaryLanguage}
          />
        ) : null}

        {step === 'lang-caregiver' ? (
          <StepLangCaregiver setupRole={profile.setupRole} />
        ) : null}

        {step === 'phrases' ? (
          <StepPhrases
            setupRole={profile.setupRole}
            phrases={profile.personalPhrases}
            onChange={(phrases) =>
              dispatch({ type: 'SET_PERSONAL_PHRASES', value: phrases })
            }
          />
        ) : null}

        {step === 'a11y-done' ? (
          <StepA11yDone setupRole={profile.setupRole} profile={profile} />
        ) : null}
      </OnboardingShell>
    </div>
  );
}

export default OnboardingPage;
