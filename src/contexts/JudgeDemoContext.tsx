import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from './SessionContext';
import { queueJudgeScenario } from '@/lib/judgeDemoQueue';
import {
  DEMO_SCENARIOS,
  instantiateScenario,
  type DemoScenario,
} from '@/services/demoScenarios';

export type JudgePhase =
  | 'idle'
  | 'fragment'
  | 'routing'
  | 'interpreting'
  | 'result'
  | 'confirm'
  | 'outcome';

interface JudgeDemoValue {
  phase: JudgePhase;
  activeScenario: DemoScenario | null;
  /** Fragmented input shown before reconstruction */
  fragmentDisplay: string | null;
  /** e.g. "→ E4B · …" */
  routingLine: string | null;
  /** Step hint for judges */
  stepHint: string;
  outcomeLine: string | null;
  /** Start phased demo for a scenario id (call after navigating home, or use launchJudgeDemo) */
  startFromScenarioId: (id: string) => void;
  /** Set pending scenario and navigate home (uses session relay.judge.once) */
  launchWalkthrough: () => void;
  /** After result phase — confirm wording / action */
  confirmStep: () => void;
  reset: () => void;
}

const JudgeDemoContext = createContext<JudgeDemoValue | null>(null);

const TIMING = {
  fragmentMs: 1400,
  routingMs: 1200,
  interpretingMs: 1600,
  beforeConfirmMs: 2200,
};

export function JudgeDemoProvider({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const { dispatch, setInterpretation, clearCurrent, state } = useSession();
  const timersRef = useRef<number[]>([]);
  const [phase, setPhase] = useState<JudgePhase>('idle');
  const [activeScenario, setActiveScenario] = useState<DemoScenario | null>(
    null,
  );
  const [fragmentDisplay, setFragmentDisplay] = useState<string | null>(null);
  const [routingLine, setRoutingLine] = useState<string | null>(null);
  const [stepHint, setStepHint] = useState('');
  const [outcomeLine, setOutcomeLine] = useState<string | null>(null);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    setPhase('idle');
    setActiveScenario(null);
    setFragmentDisplay(null);
    setRoutingLine(null);
    setStepHint('');
    setOutcomeLine(null);
  }, [clearTimers]);

  const runScenario = useCallback(
    (scenario: DemoScenario) => {
      clearTimers();
      clearCurrent();
      setOutcomeLine(null);
      setActiveScenario(scenario);
      setPhase('fragment');
      setFragmentDisplay(scenario.interpretation.sourceFragment ?? '…');
      setRoutingLine(null);
      setStepHint('Simulated listening — fragmented input appears as patients often sound.');

      dispatch({
        type: 'SET_LANGUAGE',
        language: scenario.language,
        direction: scenario.direction,
      });

      const t1 = window.setTimeout(() => {
        setPhase('routing');
        const m = scenario.interpretation.model;
        setRoutingLine(
          `→ ${m} · ${scenario.routingReasonExplicit}`,
        );
        setStepHint('Cactus-style routing chooses model tier (see About → Gemma).');
      }, TIMING.fragmentMs);
      timersRef.current.push(t1);

      const t2 = window.setTimeout(() => {
        setPhase('interpreting');
        setRoutingLine(null);
        setFragmentDisplay(null);
        dispatch({ type: 'START_PROCESSING' });
        setStepHint('Gemma-family inference (mocked in-repo) reconstructs intent.');
      }, TIMING.fragmentMs + TIMING.routingMs);
      timersRef.current.push(t2);

      const t3 = window.setTimeout(() => {
        const interp = instantiateScenario(scenario);
        setInterpretation(interp, scenario.routingReasonExplicit);
        setPhase('result');
        setStepHint('Streaming text, confidence, urgency, alternates — confirm before speak/act.');
      }, TIMING.fragmentMs + TIMING.routingMs + TIMING.interpretingMs);
      timersRef.current.push(t3);

      const t4 = window.setTimeout(() => {
        setPhase('confirm');
        setStepHint('Tap Confirm to finalize (simulates speak / smart home / emergency path).');
      }, TIMING.fragmentMs + TIMING.routingMs + TIMING.interpretingMs + TIMING.beforeConfirmMs);
      timersRef.current.push(t4);
    },
    [clearTimers, clearCurrent, dispatch, setInterpretation],
  );

  const startFromScenarioId = useCallback(
    (id: string) => {
      const scenario = DEMO_SCENARIOS.find((s) => s.id === id);
      if (!scenario) return;
      runScenario(scenario);
    },
    [runScenario],
  );

  const launchWalkthrough = useCallback(() => {
    queueJudgeScenario('breakfast');
    navigate('/');
  }, [navigate]);

  const confirmStep = useCallback(() => {
    const interp = state.currentInterpretation;
    if (!interp || phase !== 'confirm') return;
    setPhase('outcome');
    if (interp.urgency === 'HIGH') {
      setOutcomeLine(
        'Emergency path armed — countdown appears; Twilio is mocked in-repo.',
      );
    } else if (interp.actionTaken) {
      setOutcomeLine(`Action: ${interp.actionTaken}`);
    } else {
      setOutcomeLine(
        'Would speak via banked voice (voice banking in Settings).',
      );
    }
    setStepHint('Scenario complete. Run another from Demo or use the live mic (unless Demo mode is on).');
    const t = window.setTimeout(() => {
      setPhase('idle');
      setActiveScenario(null);
      setOutcomeLine(null);
      setStepHint('');
    }, 6000);
    timersRef.current.push(t);
  }, [phase, state.currentInterpretation]);

  const value: JudgeDemoValue = {
    phase,
    activeScenario,
    fragmentDisplay,
    routingLine,
    stepHint,
    outcomeLine,
    startFromScenarioId,
    launchWalkthrough,
    confirmStep,
    reset,
  };

  return (
    <JudgeDemoContext.Provider value={value}>
      {children}
    </JudgeDemoContext.Provider>
  );
}

export function useJudgeDemo() {
  const ctx = useContext(JudgeDemoContext);
  if (!ctx) throw new Error('useJudgeDemo requires JudgeDemoProvider');
  return ctx;
}
