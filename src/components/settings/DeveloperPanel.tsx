import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import {
  SettingsControlCard,
  SettingsSection,
  SettingsStack,
} from '@/components/settings/SettingsShell';
import { PillButton, Toggle } from '@/components/primitives';
import { useSettings } from '@/contexts/SettingsContext';
import { useSession } from '@/contexts/SessionContext';
import { useModelRouting } from '@/contexts/ModelRoutingContext';
import { addEntry, clearAll as clearPatientDictionary } from '@/lib/patientDictionary';
import { clearAllSamples } from '@/lib/voiceSamples';

/**
 * Developer / capability-layer info. Surfaces what's wired vs. what's
 * still a stub so the owner can tell at a glance what needs to be
 * connected next.
 */
export function DeveloperPanel() {
  const { settings, dispatch } = useSettings();
  const { dispatch: sessionDispatch } = useSession();
  const { clearLog } = useModelRouting();
  const [demoResetting, setDemoResetting] = useState(false);
  const [demoMessage, setDemoMessage] = useState<string | null>(null);
  const rows: { label: string; status: 'real' | 'stub'; detail: string }[] = [
    {
      label: 'Microphone capture',
      status: 'real',
      detail: 'getUserMedia + Web Audio AnalyserNode level meter.',
    },
    {
      label: 'Speech-to-text',
      status: 'real',
      detail:
        'Browser Web Speech API. Falls back to the Type instead sheet when unsupported.',
    },
    {
      label: 'Text-to-speech',
      status: 'real',
      detail: 'window.speechSynthesis with language-matched voice.',
    },
    {
      label: 'Camera capture',
      status: 'real',
      detail: 'getUserMedia({ video }) with frame capture for vision context.',
    },
    {
      label: 'Permissions',
      status: 'real',
      detail:
        'navigator.permissions (with graceful fallback) + denied recovery copy.',
    },
    {
      label: 'Gemma 4 interpretation',
      status: 'real',
      detail:
        'GemmaInterpreterAdapter — Ollama POST /api/generate; GemmaNotConnectedError when unreachable.',
    },
  ];

  const resetDemoState = async () => {
    if (
      typeof window !== 'undefined' &&
      !window.confirm('Reset Relay to a clean demo patient on this device?')
    ) {
      return;
    }
    setDemoResetting(true);
    setDemoMessage(null);
    try {
      await Promise.all([clearAllSamples(), clearPatientDictionary()]);
      clearLog();
      sessionDispatch({ type: 'CLEAR_HISTORY' });
      sessionDispatch({ type: 'CANCEL_CURRENT' });
      sessionDispatch({ type: 'SET_ERROR', error: null });

      dispatch({ type: 'RESET' });
      dispatch({ type: 'SET_SETUP_ROLE', value: 'caregiver' });
      dispatch({
        type: 'SET_PROFILE_FIELD',
        field: 'displayName',
        value: 'Demo patient',
      });
      dispatch({ type: 'SET_PROFILE_FIELD', field: 'condition', value: 'aphasia' });
      dispatch({
        type: 'SET_PROFILE_FIELD',
        field: 'conditionDetail',
        value: 'Short, fragmented phrases after stroke.',
      });
      dispatch({
        type: 'SET_PROFILE_FIELD',
        field: 'caregiverName',
        value: 'Demo caregiver',
      });
      dispatch({
        type: 'SET_PROFILE_FIELD',
        field: 'caregiverRelationship',
        value: 'family caregiver',
      });
      dispatch({
        type: 'SET_PERSONAL_PHRASES',
        value: ['I need water', 'Please slow down', 'I am in pain'],
      });
      dispatch({ type: 'COMPLETE_ONBOARDING' });

      await Promise.all([
        addEntry({
          modality: 'partial_word',
          rawTranscript: 'wa',
          meaning: 'I would like water, please.',
          contextTags: ['demo', 'water'],
          confirmedBy: 'demo caregiver',
        }),
        addEntry({
          modality: 'partial_word',
          rawTranscript: 'slow',
          meaning: 'Please slow down and give me time to answer.',
          contextTags: ['demo', 'aphasia'],
          confirmedBy: 'demo caregiver',
        }),
        addEntry({
          modality: 'vocalization',
          rawTranscript: 'pain arm',
          meaning: 'My arm hurts.',
          contextTags: ['demo', 'pain', 'urgent'],
          confirmedBy: 'demo caregiver',
        }),
      ]);

      setDemoMessage('Demo patient is ready. Go to Home to start the walkthrough.');
    } catch (err) {
      setDemoMessage(err instanceof Error ? err.message : 'Demo reset failed.');
    } finally {
      setDemoResetting(false);
    }
  };

  return (
    <SettingsStack>
      <SettingsSection
        title="Technical demo HUD"
        description="Small local-only overlay for judges and demos."
      >
        <SettingsControlCard>
          <Toggle
            checked={settings.developer.performanceHud}
            onChange={(value) =>
              dispatch({ type: 'SET_PERFORMANCE_HUD', value })
            }
            label="Show performance HUD"
            description="Displays tier, latency, approximate tokens/sec, and 0 cloud calls."
          />
        </SettingsControlCard>
      </SettingsSection>

      <SettingsSection
        title="Demo reset"
        description="Wipe local demo data and seed a safe patient profile for judging."
      >
        <SettingsControlCard className="space-y-2">
          <PillButton
            type="button"
            fullWidth
            variant="glass"
            disabled={demoResetting}
            leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}
            onClick={() => void resetDemoState()}
          >
            {demoResetting ? 'Resetting…' : 'Reset to demo state'}
          </PillButton>
          {demoMessage ? (
            <p className="text-xs leading-relaxed text-muted">{demoMessage}</p>
          ) : null}
        </SettingsControlCard>
      </SettingsSection>

      <SettingsSection
        title="Capability status"
        description="What this build wires to real browser APIs and Ollama."
      >
        <SettingsControlCard className="divide-y divide-black/[0.06] p-0">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex gap-3 px-3 py-3 first:pt-3 last:pb-3"
            >
              <span
                className={
                  row.status === 'real'
                    ? 'mt-0.5 inline-flex h-fit shrink-0 items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700'
                    : 'mt-0.5 inline-flex h-fit shrink-0 items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-800'
                }
              >
                {row.status === 'real' ? 'Live' : 'Stub'}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text">{row.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">
                  {row.detail}
                </p>
              </div>
            </div>
          ))}
        </SettingsControlCard>
      </SettingsSection>

      <SettingsSection title="Extend Relay">
        <SettingsControlCard className="space-y-2">
          <p className="text-xs leading-relaxed text-muted">
            Customize prompts and timeouts in{' '}
            <code className="rounded bg-black/5 px-1 text-[11px]">
              GemmaInterpreterAdapter
            </code>
            . All input surfaces share the same interpretation path.
          </p>
          <Link
            to="/about"
            className="inline-block text-xs font-medium text-[var(--accent)] underline-offset-2 hover:underline"
          >
            Architecture overview →
          </Link>
        </SettingsControlCard>
      </SettingsSection>
    </SettingsStack>
  );
}
