import { useEffect, useState } from 'react';

interface Options {
  text: string;
  wordsPerTick?: number;
  intervalMs?: number;
  enabled?: boolean;
}

/**
 * Reveals words progressively to simulate streaming model output.
 * When `prefers-reduced-motion: reduce` is set, returns the whole text
 * immediately for accessibility.
 */
export function useStreamingText({
  text,
  wordsPerTick = 1,
  intervalMs = 70,
  enabled = true,
}: Options): { shown: string; isStreaming: boolean } {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled || !text) {
      setCount(0);
      return;
    }
    const prefersReduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const words = text.split(/\s+/);
    if (prefersReduce) {
      setCount(words.length);
      return;
    }
    setCount(0);
    const handle = window.setInterval(() => {
      setCount((prev) => {
        const next = prev + wordsPerTick;
        if (next >= words.length) {
          window.clearInterval(handle);
          return words.length;
        }
        return next;
      });
    }, intervalMs);
    return () => window.clearInterval(handle);
  }, [text, wordsPerTick, intervalMs, enabled]);

  const words = text ? text.split(/\s+/) : [];
  return {
    shown: words.slice(0, count).join(' '),
    isStreaming: count < words.length,
  };
}
