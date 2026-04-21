/**
 * Placeholder for the real Gemma 4 interpretation adapter.
 *
 * This file intentionally does not call any model. When Gemma is wired,
 * implement `interpret()` to:
 *
 *   1. Hit the local Ollama endpoint (or a hosted gateway) with a typed
 *      `InferenceRequest` payload derived from `InterpretationInput`.
 *   2. Select between E2B / E4B / 27B (mirror the logic in
 *      `modelRouter.chooseModel`, or replace with Cactus routing).
 *   3. Pass multimodal payloads (image data URL / blob) when available.
 *   4. Run the emergency classifier before returning HIGH urgency.
 *   5. Handle multilingual inputs (respect `input.language` and the
 *      `SettingsContext.language.primaryLanguage`).
 *   6. Produce a `InterpretationResult` with routing reason + latency so
 *      the caregiver routing log + ModelChip stay meaningful.
 *   7. Expose smart-home function-call suggestions on the result, once the
 *      SmartThings adapter gains a production endpoint.
 *
 * Keeping this as a thrown `NotImplemented` prevents the UI from silently
 * pretending to call Gemma while the adapter is still a stub.
 *
 * See docs/GEMMA_AND_INTEGRATIONS.md for the full wiring plan.
 */

import type {
  InterpretationInput,
  InterpretationResult,
  InterpreterAdapter,
} from '../interpretationService';

async function interpret(
  _input: InterpretationInput,
): Promise<InterpretationResult> {
  throw new Error(
    'GemmaInterpreterAdapter is not implemented. Wire an Ollama or Gemma ' +
      'endpoint here — see docs/GEMMA_AND_INTEGRATIONS.md.',
  );
}

export const GemmaInterpreterAdapter: InterpreterAdapter = {
  id: 'gemma',
  interpret,
};
