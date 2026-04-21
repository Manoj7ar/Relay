/**
 * Camera preview + frame capture for multimodal context.
 *
 * The hook (`useCamera`) owns lifecycle; UI binds the preview stream onto a
 * `<video>` element via `attachStream`. No Gemma/vision integration yet;
 * captured frames are stored as data URLs / blobs on the session for the
 * next interpretation call.
 */

import { mediaErrorToPermission, type PermissionState } from './permissionsService';

export type CameraState =
  | 'idle'
  | 'requesting_permission'
  | 'ready'
  | 'active'
  | 'error';

export interface CameraError {
  kind: 'unsupported' | 'permission_denied' | 'no_device' | 'busy' | 'unknown';
  message: string;
  permission?: PermissionState;
}

export interface CameraHandle {
  stream: MediaStream;
  stop: () => void;
}

export interface CaptureResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  ts: number;
}

export function isCameraSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices !== 'undefined' &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  );
}

function errorFromGetUserMedia(err: unknown): CameraError {
  const permission = mediaErrorToPermission(err);
  if (permission === 'denied') {
    return {
      kind: 'permission_denied',
      message: 'Camera access was blocked. Enable it in site settings.',
      permission,
    };
  }
  if (permission === 'unavailable') {
    return {
      kind: 'no_device',
      message: 'No camera was found on this device.',
      permission,
    };
  }
  if (err instanceof Error && err.name === 'NotReadableError') {
    return {
      kind: 'busy',
      message: 'The camera is being used by another app.',
      permission,
    };
  }
  return {
    kind: 'unknown',
    message:
      err instanceof Error ? err.message : 'Could not start the camera.',
    permission,
  };
}

export async function openCamera(): Promise<CameraHandle> {
  if (!isCameraSupported()) {
    throw {
      kind: 'unsupported',
      message: 'This browser does not support camera capture.',
    } satisfies CameraError;
  }
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    });
  } catch (err) {
    throw errorFromGetUserMedia(err);
  }

  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    stream.getTracks().forEach((t) => {
      try {
        t.stop();
      } catch {
        // ignore
      }
    });
  };

  return { stream, stop };
}

export function attachStream(
  videoEl: HTMLVideoElement,
  stream: MediaStream,
): void {
  videoEl.srcObject = stream;
  videoEl.playsInline = true;
  videoEl.muted = true;
  void videoEl.play().catch(() => undefined);
}

export function detachStream(videoEl: HTMLVideoElement): void {
  try {
    videoEl.pause();
  } catch {
    // ignore
  }
  videoEl.srcObject = null;
}

/**
 * Grab the current frame from a video element. Useful for caching a
 * context image alongside a speech interpretation.
 */
export async function captureFrame(
  videoEl: HTMLVideoElement,
  mimeType = 'image/jpeg',
  quality = 0.82,
): Promise<CaptureResult | null> {
  const width = videoEl.videoWidth;
  const height = videoEl.videoHeight;
  if (!width || !height) return null;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(videoEl, 0, 0, width, height);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), mimeType, quality),
  );
  if (!blob) return null;
  const dataUrl = canvas.toDataURL(mimeType, quality);
  return { blob, dataUrl, width, height, ts: Date.now() };
}
