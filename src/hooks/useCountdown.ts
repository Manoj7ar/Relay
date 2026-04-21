import { useEffect, useRef, useState } from 'react';

interface Options {
  from: number;
  active: boolean;
  onZero?: () => void;
  tickMs?: number;
}

export function useCountdown({ from, active, onZero, tickMs = 1000 }: Options) {
  const [remaining, setRemaining] = useState(from);
  const zeroedRef = useRef(false);

  useEffect(() => {
    if (!active) {
      setRemaining(from);
      zeroedRef.current = false;
      return;
    }
    setRemaining(from);
    zeroedRef.current = false;
    const handle = window.setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0 && !zeroedRef.current) {
          zeroedRef.current = true;
          onZero?.();
          window.clearInterval(handle);
          return 0;
        }
        return next;
      });
    }, tickMs);
    return () => window.clearInterval(handle);
  }, [active, from, onZero, tickMs]);

  return remaining;
}
