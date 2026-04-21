import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { load, save } from '@/lib/storage';

interface FineTuningState {
  baselineAccuracy: number;
  currentAccuracy: number;
  sampleCount: number;
  targetSamples: number;
  corrections: number;
}

interface FineTuningContextValue extends FineTuningState {
  logInteraction: () => void;
  logCorrection: () => void;
  reset: () => void;
}

const DEFAULT_STATE: FineTuningState = {
  baselineAccuracy: 0.72,
  currentAccuracy: 0.81,
  sampleCount: 37,
  targetSamples: 100,
  corrections: 8,
};

const STORAGE_KEY = 'relay.finetune';

const FineTuningContext = createContext<FineTuningContextValue | null>(null);

export function FineTuningProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<FineTuningState>(() =>
    load(STORAGE_KEY, DEFAULT_STATE),
  );

  useEffect(() => {
    save(STORAGE_KEY, state);
  }, [state]);

  const logInteraction = useCallback(() => {
    setState((prev) => {
      const sampleCount = Math.min(prev.targetSamples, prev.sampleCount + 1);
      const gain = (sampleCount / prev.targetSamples) * 0.2;
      const currentAccuracy = Math.min(
        0.96,
        prev.baselineAccuracy + 0.09 + gain,
      );
      return { ...prev, sampleCount, currentAccuracy };
    });
  }, []);

  const logCorrection = useCallback(() => {
    setState((prev) => ({ ...prev, corrections: prev.corrections + 1 }));
  }, []);

  const reset = useCallback(() => setState(DEFAULT_STATE), []);

  const value = useMemo<FineTuningContextValue>(
    () => ({ ...state, logInteraction, logCorrection, reset }),
    [state, logInteraction, logCorrection, reset],
  );

  return (
    <FineTuningContext.Provider value={value}>
      {children}
    </FineTuningContext.Provider>
  );
}

export function useFineTuning() {
  const ctx = useContext(FineTuningContext);
  if (!ctx)
    throw new Error('useFineTuning must be used within FineTuningProvider');
  return ctx;
}
