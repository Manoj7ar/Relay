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
import type {
  Interpretation,
  ModelId,
  RoutingLogEntry,
} from '@/types/model';
import { logEntryFromInterpretation } from '@/services/modelRouter';
import { routingEntryFromToolEvent } from '@/services/interpretation/HandoverAgent';
import type { HandoverToolEvent } from '@/types/handover';

interface ModelRoutingValue {
  currentModel: ModelId;
  routingLog: RoutingLogEntry[];
  setCurrentModel: (m: ModelId) => void;
  recordInterpretation: (interp: Interpretation, reason: string) => void;
  recordToolInvocation: (event: HandoverToolEvent) => void;
  clearLog: () => void;
}

const ModelRoutingContext = createContext<ModelRoutingValue | null>(null);

const STORAGE_KEY = 'relay.routing.log';
const MAX_LOG = 50;

export function ModelRoutingProvider({ children }: PropsWithChildren) {
  const [currentModel, setCurrentModel] = useState<ModelId>('E2B');
  const [routingLog, setRoutingLog] = useState<RoutingLogEntry[]>(() =>
    load<RoutingLogEntry[]>(STORAGE_KEY, []),
  );

  useEffect(() => {
    save(STORAGE_KEY, routingLog);
  }, [routingLog]);

  const recordInterpretation = useCallback(
    (interp: Interpretation, reason: string) => {
      setCurrentModel(interp.model);
      const entry = logEntryFromInterpretation(interp, reason);
      setRoutingLog((prev) => [entry, ...prev].slice(0, MAX_LOG));
    },
    [],
  );

  const recordToolInvocation = useCallback((event: HandoverToolEvent) => {
    setCurrentModel('27B');
    const entry = routingEntryFromToolEvent(event);
    setRoutingLog((prev) => [entry, ...prev].slice(0, MAX_LOG));
  }, []);

  const clearLog = useCallback(() => setRoutingLog([]), []);

  const value = useMemo(
    () => ({
      currentModel,
      routingLog,
      setCurrentModel,
      recordInterpretation,
      recordToolInvocation,
      clearLog,
    }),
    [currentModel, routingLog, recordInterpretation, recordToolInvocation, clearLog],
  );

  return (
    <ModelRoutingContext.Provider value={value}>
      {children}
    </ModelRoutingContext.Provider>
  );
}

export function useModelRouting() {
  const ctx = useContext(ModelRoutingContext);
  if (!ctx)
    throw new Error('useModelRouting must be used within ModelRoutingProvider');
  return ctx;
}
