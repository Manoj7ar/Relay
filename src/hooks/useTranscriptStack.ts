import { useEffect, useState } from 'react';
import type { Interpretation } from '@/types/model';

export interface TranscriptStack {
  departing: Interpretation | null;
  prev: Interpretation | null;
  curr: Interpretation | null;
}

const CLEAR_DEPARTING_MS = 380;

/**
 * Tracks up to two visible interpretations plus an optional departing row for exit animation.
 * Preserves stack when `interpretation` is cleared during listen/process until the next result.
 */
export function useTranscriptStack(params: {
  interpretation: Interpretation | null;
  historyLength: number;
  isListening: boolean;
  isProcessing: boolean;
}): TranscriptStack {
  const [stack, setStack] = useState<TranscriptStack>({
    departing: null,
    prev: null,
    curr: null,
  });

  useEffect(() => {
    if (
      params.interpretation !== null ||
      params.historyLength !== 0 ||
      params.isListening ||
      params.isProcessing
    ) {
      return;
    }
    setStack({ departing: null, prev: null, curr: null });
  }, [
    params.interpretation,
    params.historyLength,
    params.isListening,
    params.isProcessing,
  ]);

  useEffect(() => {
    if (!params.interpretation) return;

    setStack((s) => {
      if (s.curr?.id === params.interpretation!.id) {
        return {
          ...s,
          curr: params.interpretation!,
        };
      }
      return {
        departing: s.prev,
        prev: s.curr,
        curr: params.interpretation!,
      };
    });
  }, [params.interpretation]);

  useEffect(() => {
    if (!stack.departing) return undefined;
    const id = window.setTimeout(() => {
      setStack((s) => ({ ...s, departing: null }));
    }, CLEAR_DEPARTING_MS);
    return () => clearTimeout(id);
  }, [stack.departing]);

  return stack;
}
