/**
 * Adapter that wraps the existing rule-based router (`modelRouter.ts`)
 * and its mocked `infer*` functions. Preserves `RoutingLog` / `ModelChip`
 * semantics so the caregiver surfaces keep working.
 *
 * This is the adapter the Judge Demo scenarios + `demoMode` lean on.
 */

import type { InferenceRequest, Interpretation, InputType } from '@/types/model';
import { chooseModel, runInference } from '../modelRouter';
import { DEMO_SCENARIOS, instantiateScenario } from '../demoScenarios';
import type {
  InterpretationInput,
  InterpretationResult,
  InterpreterAdapter,
} from '../interpretationService';

function toInputType(
  sourceType: InterpretationInput['sourceType'],
  hasImage: boolean,
): InputType {
  if (hasImage && sourceType === 'speech') return 'vision+speech';
  if (sourceType === 'symbols') return 'symbols';
  if (sourceType === 'text') return 'text';
  return 'speech';
}

function toResult(
  interp: Interpretation,
  reason: string,
  sourceType: InterpretationInput['sourceType'],
): InterpretationResult {
  return {
    id: interp.id,
    ts: interp.ts,
    primaryText: interp.primary,
    alternates: interp.alternates,
    confidence: interp.confidence,
    urgency: interp.urgency,
    mood: interp.mood,
    detectedLanguage: interp.detectedLanguage,
    translation: interp.translation,
    sourceModel: interp.model,
    sourceType,
    routingReason: reason,
    latencyMs: interp.latencyMs,
    visionUsed: interp.visionUsed,
    sourceFragment: interp.sourceFragment,
  };
}

async function interpret(
  input: InterpretationInput,
): Promise<InterpretationResult> {
  if (input.sourceType === 'demo' && input.scenarioId) {
    const scenario = DEMO_SCENARIOS.find((s) => s.id === input.scenarioId);
    if (scenario) {
      const interp = instantiateScenario(scenario);
      return toResult(interp, scenario.routingReasonExplicit, 'demo');
    }
  }

  const req: InferenceRequest = {
    inputType: toInputType(input.sourceType, Boolean(input.imageDataUrl)),
    transcript: input.transcript,
    symbols: input.symbols,
    language: input.language,
    urgencyHint: input.urgencyHint,
    visionOn: Boolean(input.imageDataUrl),
  };
  const decision = chooseModel(req);
  const interp = await runInference(req);
  return toResult(interp, decision.reason, input.sourceType);
}

export const MockRouterAdapter: InterpreterAdapter = {
  id: 'mock',
  interpret,
};
