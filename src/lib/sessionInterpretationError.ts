import type { SessionInterpretationError } from '@/types/interpretationError';
import { GemmaNotConnectedError } from '@/services/interpretation/GemmaInterpreterAdapter';

export function sessionErrorFromUnknown(
  err: unknown,
): SessionInterpretationError {
  if (err instanceof GemmaNotConnectedError) {
    return err.surface;
  }
  if (err instanceof Error) {
    const msg = err.message.trim();
    return {
      code: 'unknown',
      title: 'Something went wrong',
      hint: msg.length > 200 ? `${msg.slice(0, 200)}…` : msg || undefined,
    };
  }
  return {
    code: 'unknown',
    title: 'Interpretation failed',
    hint: 'Please try again.',
  };
}
