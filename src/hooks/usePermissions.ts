import { useCallback, useEffect, useRef, useState } from 'react';
import {
  isPermissionsSupported,
  queryPermission,
  requestPermission,
  watchPermission,
  type PermissionKind,
  type PermissionState,
} from '@/services/permissionsService';

interface PermissionHookState {
  state: PermissionState;
  requesting: boolean;
  supported: boolean;
  error: string | null;
}

const INITIAL: PermissionHookState = {
  state: 'unknown',
  requesting: false,
  supported: isPermissionsSupported(),
  error: null,
};

/**
 * Centralized permission state for a single kind (mic or camera).
 *
 * Prevents double-prompts by gating `request()` behind a pending flag.
 */
export function usePermissions(kind: PermissionKind) {
  const [state, setState] = useState<PermissionHookState>(INITIAL);
  const pendingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;
    let unwatch: (() => void) | null = null;

    (async () => {
      const res = await queryPermission(kind);
      if (cancelled) return;
      setState((prev) => ({ ...prev, state: res.state }));
      unwatch = await watchPermission(kind, (next) => {
        if (!mountedRef.current) return;
        setState((prev) => ({ ...prev, state: next }));
      });
    })();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      unwatch?.();
    };
  }, [kind]);

  const request = useCallback(async (): Promise<PermissionState> => {
    if (pendingRef.current) return state.state;
    pendingRef.current = true;
    setState((prev) => ({ ...prev, requesting: true, error: null }));
    try {
      const next = await requestPermission(kind);
      if (mountedRef.current) {
        setState((prev) => ({ ...prev, state: next, requesting: false }));
      }
      return next;
    } catch (err) {
      if (mountedRef.current) {
        setState((prev) => ({
          ...prev,
          requesting: false,
          error: err instanceof Error ? err.message : String(err),
        }));
      }
      return 'denied';
    } finally {
      pendingRef.current = false;
    }
  }, [kind, state.state]);

  return {
    state: state.state,
    supported: state.supported,
    requesting: state.requesting,
    error: state.error,
    request,
  };
}
