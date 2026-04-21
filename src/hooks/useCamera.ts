import { useCallback, useEffect, useRef, useState } from 'react';
import {
  attachStream,
  captureFrame,
  detachStream,
  isCameraSupported,
  openCamera,
  type CameraError,
  type CameraHandle,
  type CameraState,
  type CaptureResult,
} from '@/services/cameraService';

interface UseCameraState {
  state: CameraState;
  error: CameraError | null;
  supported: boolean;
}

export function useCamera() {
  const [hookState, setHookState] = useState<UseCameraState>({
    state: 'idle',
    error: null,
    supported: isCameraSupported(),
  });
  const handleRef = useRef<CameraHandle | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (videoElRef.current) detachStream(videoElRef.current);
      handleRef.current?.stop();
      handleRef.current = null;
    };
  }, []);

  const bindVideo = useCallback((el: HTMLVideoElement | null) => {
    videoElRef.current = el;
    if (el && handleRef.current) attachStream(el, handleRef.current.stream);
  }, []);

  const start = useCallback(async (): Promise<CameraHandle | null> => {
    if (handleRef.current) return handleRef.current;
    setHookState((prev) => ({
      ...prev,
      state: 'requesting_permission',
      error: null,
    }));
    try {
      const handle = await openCamera();
      if (!mountedRef.current) {
        handle.stop();
        return null;
      }
      handleRef.current = handle;
      if (videoElRef.current) attachStream(videoElRef.current, handle.stream);
      setHookState((prev) => ({ ...prev, state: 'active', error: null }));
      return handle;
    } catch (err) {
      const cErr = err as CameraError;
      setHookState((prev) => ({ ...prev, state: 'error', error: cErr }));
      return null;
    }
  }, []);

  const stop = useCallback(() => {
    if (videoElRef.current) detachStream(videoElRef.current);
    handleRef.current?.stop();
    handleRef.current = null;
    if (mountedRef.current) {
      setHookState((prev) => ({ ...prev, state: 'idle' }));
    }
  }, []);

  const capture = useCallback(async (): Promise<CaptureResult | null> => {
    const el = videoElRef.current;
    if (!el || !handleRef.current) return null;
    return captureFrame(el);
  }, []);

  return {
    state: hookState.state,
    error: hookState.error,
    supported: hookState.supported,
    active: handleRef.current !== null,
    bindVideo,
    start,
    stop,
    capture,
  };
}
