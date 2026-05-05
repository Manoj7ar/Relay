/**
 * Deterministic routing policy for the Gemma-family stack.
 *
 * Only pure routing decisions live here — no inference, no mocked dictionaries.
 * The real Gemma adapter (`src/services/interpretation/GemmaInterpreterAdapter.ts`)
 * is expected to call `chooseModel` (or replace it with a Cactus-style router),
 * perform the actual inference, and emit `Interpretation` objects whose
 * `model` field is then fed into the routing log via
 * `logEntryFromInterpretation`.
 */
import { uid } from '@/lib/id';
import type {
  InferenceRequest,
  Interpretation,
  ModelId,
  RoutingLogEntry,
} from '@/types/model';

type RoutedGemmaModelId = Exclude<ModelId, 'OLLAMA'>;

export interface RoutingDecision {
  model: RoutedGemmaModelId;
  reason: string;
}

/**
 * Routing policy based purely on the shape of the incoming request.
 * Swap out for a learned router (e.g. Cactus) without touching any UI.
 */
export function chooseModel(req: InferenceRequest): RoutingDecision {
  if (req.inputType === 'compound') {
    return { model: '27B', reason: 'Concurrent signals → multimodal fusion.' };
  }
  if (req.visionOn || req.inputType === 'vision+speech') {
    return { model: '27B', reason: 'Camera + speech → multimodal reasoning.' };
  }
  if (req.urgencyHint === 'HIGH') {
    return { model: '27B', reason: 'High urgency hint → reasoning model.' };
  }
  if (req.inputType === 'symbols') {
    return {
      model: 'E4B',
      reason: 'Symbol input → fine-tuned phrase expansion.',
    };
  }
  if (req.inputType === 'text') {
    return { model: 'E2B', reason: 'Text shortcut → real-time inference.' };
  }
  return { model: 'E2B', reason: 'Short speech → real-time inference.' };
}

export function logEntryFromInterpretation(
  interp: Interpretation,
  reason: string,
): RoutingLogEntry {
  return {
    id: uid('rlog'),
    ts: interp.ts,
    inputType: interp.inputType,
    model: interp.model,
    latencyMs: interp.latencyMs,
    reason,
    visionUsed: interp.visionUsed,
  };
}
