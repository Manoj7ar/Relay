import { useCallback, useEffect, useRef, useState } from 'react';
import {
  isAudioCaptureSupported,
  openMicrophone,
  type MicCaptureError,
  type MicCaptureHandle,
  type MicCaptureState,
} from '@/services/audioCaptureService';

interface MicHookState {
  state: MicCaptureState;
  level: number;
  error: MicCaptureError | null;
  supported: boolean;
}

export function useMicrophone() {
  const [hookState, setHookState] = useState<MicHookState>({
    state: 'idle',
    level: 0,
    error: null,
    supported: isAudioCaptureSupported(),
  });
  const handleRef = useRef<MicCaptureHandle | null>(null);
  const rafRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      handleRef.current?.stop();
      handleRef.current = null;
    };
  }, []);

  const tickLevel = useCallback(() => {
    const handle = handleRef.current;
    if (!handle) return;
    const level = handle.getLevel();
    setHookState((prev) => (prev.level === level ? prev : { ...prev, level }));
    rafRef.current = requestAnimationFrame(tickLevel);
  }, []);

  const start = useCallback(async (): Promise<MicCaptureHandle | null> => {
    if (handleRef.current) return handleRef.current;
    setHookState((prev) => ({
      ...prev,
      state: 'requesting_permission',
      error: null,
    }));
    try {
      const handle = await openMicrophone();
      if (!mountedRef.current) {
        handle.stop();
        return null;
      }
      handleRef.current = handle;
      setHookState((prev) => ({ ...prev, state: 'listening', error: null }));
      rafRef.current = requestAnimationFrame(tickLevel);
      return handle;
    } catch (err) {
      const micErr = err as MicCaptureError;
      setHookState((prev) => ({
        ...prev,
        state: 'error',
        error: micErr,
      }));
      return null;
    }
  }, [tickLevel]);

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    handleRef.current?.stop();
    handleRef.current = null;
    if (mountedRef.current) {
      setHookState((prev) => ({ ...prev, state: 'idle', level: 0 }));
    }
  }, []);

  return {
    state: hookState.state,
    level: hookState.level,
    error: hookState.error,
    supported: hookState.supported,
    active: handleRef.current !== null,
    start,
    stop,
  };
}
