/**
 * The real Gemma 4 interpretation adapter — currently unimplemented on
 * purpose so the UI never silently fakes a response.
 *
 * When wiring this up, implement `interpret()` to:
 *
 *   1. Build an `InferenceRequest` from `InterpretationInput`.
 *   2. Call `chooseModel(req)` (from `../modelRouter`) — or a Cactus-style
 *      learned router — to pick between Gemma E2B / E4B / 26B / 31B.
 *   3. POST to your local Ollama endpoint (or a hosted gateway) with the
 *      typed payload (text + optional image data URL).
 *   4. Map the raw model output into `InterpretationResult`, including the
 *      routing reason + latency so the caregiver routing log stays real.
 *   5. Respect `input.language` for multilingual inputs.
 *   6. Emit tool-call suggestions (SmartThings / Twilio) once those
 *      integrations are wired in their respective services.
 *
 * Throwing `NotImplemented` until then is intentional: the rest of the
 * app will surface a clear "Gemma not connected" state rather than print
 * a fabricated answer.
 *
 * See docs/GEMMA_AND_INTEGRATIONS.md for the full wiring plan.
 */

import type {
  InterpretationInput,
  InterpretationResult,
  InterpreterAdapter,
} from '../interpretationService';

export class GemmaNotConnectedError extends Error {
  constructor() {
    super(
      'Gemma 4 is not connected. Implement ' +
        'src/services/interpretation/GemmaInterpreterAdapter.ts ' +
        '(see docs/GEMMA_AND_INTEGRATIONS.md).',
    );
    this.name = 'GemmaNotConnectedError';
  }
}

async function interpret(
  _input: InterpretationInput,
): Promise<InterpretationResult> {
  throw new GemmaNotConnectedError();
}

export const GemmaInterpreterAdapter: InterpreterAdapter = {
  id: 'gemma',
  interpret,
};
