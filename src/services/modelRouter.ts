/**
 * Model routing and Gemma-family inference stubs.
 *
 * Layer: service / model routing. Production wiring: HTTP to Ollama or your
 * gateway; replace `infer*` bodies. Routing policy: replace `chooseModel` with
 * Cactus or equivalent — see docs/GEMMA_AND_INTEGRATIONS.md
 */
import { uid } from '@/lib/id';
import type {
  InferenceRequest,
  Interpretation,
  ModelId,
  RoutingLogEntry,
  Urgency,
} from '@/types/model';

export interface RoutingDecision {
  model: ModelId;
  reason: string;
}

/**
 * Simple deterministic routing based on inputs. The real Cactus router will
 * replace this; the interface is stable.
 */
export function chooseModel(req: InferenceRequest): RoutingDecision {
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

// TODO: wire to Gemma 4 / Ollama endpoints — see docs/GEMMA_AND_INTEGRATIONS.md
export async function inferE2B(
  req: InferenceRequest,
): Promise<Interpretation> {
  return runMock(req, 'E2B', 420 + Math.random() * 320);
}

export async function inferE4B(
  req: InferenceRequest,
): Promise<Interpretation> {
  return runMock(req, 'E4B', 820 + Math.random() * 500);
}

export async function infer27B(
  req: InferenceRequest,
): Promise<Interpretation> {
  return runMock(req, '27B', 5500 + Math.random() * 3000);
}

async function runMock(
  req: InferenceRequest,
  model: ModelId,
  latencyMs: number,
): Promise<Interpretation> {
  await new Promise((r) => setTimeout(r, Math.min(latencyMs, 1400)));
  const draft = draftInterpretation(req);
  return {
    id: uid('utt'),
    ts: Date.now(),
    primary: draft.primary,
    alternates: draft.alternates,
    confidence: draft.confidence,
    urgency: draft.urgency,
    mood: draft.mood,
    detectedLanguage: req.language ?? 'en-US',
    translation: draft.translation,
    model,
    latencyMs: Math.round(latencyMs),
    inputType: req.inputType,
    visionUsed: Boolean(req.visionOn) || req.inputType === 'vision+speech',
    sourceFragment: req.transcript ?? req.symbols?.join(', '),
  };
}

interface Drafted {
  primary: string;
  alternates: string[];
  confidence: number;
  urgency: Urgency;
  mood: Interpretation['mood'];
  translation?: string;
}

function draftInterpretation(req: InferenceRequest): Drafted {
  const fragment = (req.transcript ?? req.symbols?.join(' ') ?? '').toLowerCase();

  if (fragment.includes('pain') || fragment.includes('hurt')) {
    return {
      primary: 'I am in pain and need help.',
      alternates: ['I have discomfort.', 'Please get the nurse.'],
      confidence: 0.78,
      urgency: 'HIGH',
      mood: 'in-pain',
      translation: 'Estoy con dolor y necesito ayuda.',
    };
  }
  if (fragment.includes('water') || fragment.includes('drink')) {
    return {
      primary: 'I would like some water, please.',
      alternates: ['Could I have a drink?', 'Please bring water.'],
      confidence: 0.91,
      urgency: 'LOW',
      mood: 'calm',
      translation: 'Me gustaría un poco de agua, por favor.',
    };
  }
  if (fragment.includes('breakfast') || fragment.includes('food') || fragment.includes('hungry')) {
    return {
      primary: 'I am ready for breakfast.',
      alternates: ['I would like to eat.', 'Please bring my meal.'],
      confidence: 0.88,
      urgency: 'LOW',
      mood: 'calm',
      translation: 'Estoy listo para desayunar.',
    };
  }
  if (fragment.includes('bathroom') || fragment.includes('toilet')) {
    return {
      primary: 'I need to use the bathroom.',
      alternates: ['I need the toilet.', 'Please help me to the washroom.'],
      confidence: 0.84,
      urgency: 'NORMAL',
      mood: 'calm',
    };
  }
  if (fragment.includes('cold')) {
    return {
      primary: 'I feel cold. Please raise the temperature.',
      alternates: ['I am cold.', 'Please bring a blanket.'],
      confidence: 0.82,
      urgency: 'LOW',
      mood: 'calm',
    };
  }
  if (fragment.includes('help') || fragment.includes('emergency')) {
    return {
      primary: 'I need urgent help, please.',
      alternates: ['Please call someone.', 'Get the nurse.'],
      confidence: 0.74,
      urgency: 'HIGH',
      mood: 'distressed',
    };
  }

  return {
    primary: 'I would like to say something.',
    alternates: ['Please give me a moment.', 'I need to share something.'],
    confidence: 0.6,
    urgency: 'NORMAL',
    mood: 'calm',
  };
}

export function runInference(
  req: InferenceRequest,
): Promise<Interpretation> {
  const { model } = chooseModel(req);
  if (model === 'E2B') return inferE2B(req);
  if (model === 'E4B') return inferE4B(req);
  return infer27B(req);
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
