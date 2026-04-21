/**
 * Cross-browser permission queries and requests for microphone + camera.
 *
 * All browser API access lives here. Hooks wrap this with React state.
 * See docs/ARCHITECTURE.md.
 */

export type PermissionKind = 'microphone' | 'camera';
export type PermissionState =
  | 'granted'
  | 'prompt'
  | 'denied'
  | 'unavailable'
  | 'unknown';

export interface PermissionQueryResult {
  state: PermissionState;
  /** Whether the browser-level Permissions API could answer the query. */
  queryable: boolean;
}

function hasPermissionsApi(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.permissions !== 'undefined' &&
    typeof navigator.permissions.query === 'function'
  );
}

function hasMediaDevices(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices !== 'undefined' &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  );
}

function permissionNameFor(kind: PermissionKind): PermissionName {
  return kind === 'microphone' ? 'microphone' : 'camera';
}

export async function queryPermission(
  kind: PermissionKind,
): Promise<PermissionQueryResult> {
  if (!hasMediaDevices()) {
    return { state: 'unavailable', queryable: false };
  }
  if (!hasPermissionsApi()) {
    return { state: 'unknown', queryable: false };
  }
  try {
    const status = await navigator.permissions.query({
      name: permissionNameFor(kind) as PermissionName,
    });
    return { state: status.state as PermissionState, queryable: true };
  } catch {
    // Firefox returns TypeError for 'microphone'/'camera' in some versions.
    return { state: 'unknown', queryable: false };
  }
}

/**
 * Attach a change listener to the browser-level permission status.
 * Returns an unsubscribe fn (no-op when unavailable).
 */
export async function watchPermission(
  kind: PermissionKind,
  onChange: (state: PermissionState) => void,
): Promise<() => void> {
  if (!hasPermissionsApi()) return () => undefined;
  try {
    const status = await navigator.permissions.query({
      name: permissionNameFor(kind) as PermissionName,
    });
    const handler = () => onChange(status.state as PermissionState);
    status.addEventListener('change', handler);
    return () => status.removeEventListener('change', handler);
  } catch {
    return () => undefined;
  }
}

/**
 * Map a `getUserMedia` rejection to our PermissionState.
 */
export function mediaErrorToPermission(err: unknown): PermissionState {
  if (!(err instanceof Error)) return 'unknown';
  const name = (err as DOMException).name;
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'unavailable';
  }
  return 'unknown';
}

/**
 * Request permission by invoking `getUserMedia` and immediately stopping
 * the returned tracks. The hook ecosystem uses this for first-time grants;
 * for actual capture use `audioCaptureService` / `cameraService`.
 */
export async function requestPermission(
  kind: PermissionKind,
): Promise<PermissionState> {
  if (!hasMediaDevices()) return 'unavailable';
  try {
    const constraints: MediaStreamConstraints =
      kind === 'microphone' ? { audio: true } : { video: true };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    stream.getTracks().forEach((t) => t.stop());
    return 'granted';
  } catch (err) {
    return mediaErrorToPermission(err);
  }
}

export function isPermissionsSupported(): boolean {
  return hasMediaDevices();
}
