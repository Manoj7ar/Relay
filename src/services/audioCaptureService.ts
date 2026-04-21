/**
 * Microphone capture with lifecycle-safe teardown and an analyser for
 * visualizing input level.
 *
 * All mutations happen through the returned handle; the hook (`useMicrophone`)
 * owns subscription + cleanup.
 */

import { mediaErrorToPermission, type PermissionState } from './permissionsService';

export type MicCaptureState =
  | 'idle'
  | 'requesting_permission'
  | 'ready'
  | 'listening'
  | 'processing'
  | 'error';

export interface MicCaptureError {
  kind:
    | 'unsupported'
    | 'permission_denied'
    | 'no_device'
    | 'busy'
    | 'interrupted'
    | 'unknown';
  message: string;
  permission?: PermissionState;
}

export interface MicCaptureHandle {
  stream: MediaStream;
  /** Returns a 0..1 instantaneous RMS level, or 0 if analyser unavailable. */
  getLevel: () => number;
  /** Stops tracks and closes the audio context. Idempotent. */
  stop: () => void;
}

export function isAudioCaptureSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices !== 'undefined' &&
    typeof navigator.mediaDevices.getUserMedia === 'function' &&
    // AudioContext is needed for the analyser level; we degrade if missing.
    typeof (window.AudioContext ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as unknown as { webkitAudioContext?: any }).webkitAudioContext) !==
      'undefined'
  );
}

function errorFromGetUserMedia(err: unknown): MicCaptureError {
  const permission = mediaErrorToPermission(err);
  if (permission === 'denied') {
    return {
      kind: 'permission_denied',
      message: 'Microphone access was blocked. Enable it in site settings.',
      permission,
    };
  }
  if (permission === 'unavailable') {
    return {
      kind: 'no_device',
      message: 'No microphone was found on this device.',
      permission,
    };
  }
  if (err instanceof Error) {
    if (err.name === 'NotReadableError') {
      return {
        kind: 'busy',
        message: 'The microphone is being used by another app.',
        permission,
      };
    }
    return { kind: 'unknown', message: err.message, permission };
  }
  return {
    kind: 'unknown',
    message: 'Could not start microphone.',
    permission,
  };
}

/**
 * Open the mic and wire an analyser for visual feedback. Caller must call
 * `handle.stop()` when done.
 */
export async function openMicrophone(): Promise<MicCaptureHandle> {
  if (!isAudioCaptureSupported()) {
    throw {
      kind: 'unsupported',
      message: 'This browser does not support microphone capture.',
    } satisfies MicCaptureError;
  }

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
  } catch (err) {
    throw errorFromGetUserMedia(err);
  }

  // Best-effort analyser; level meter degrades to 0 on failure.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AC = (window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext) as typeof AudioContext | undefined;
  let ctx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  try {
    if (AC) {
      ctx = new AC();
      analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
    }
  } catch {
    analyser = null;
  }

  const dataArray = analyser ? new Uint8Array(analyser.fftSize) : null;

  const getLevel = (): number => {
    if (!analyser || !dataArray) return 0;
    analyser.getByteTimeDomainData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const v = (dataArray[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / dataArray.length);
    return Math.min(1, rms * 3);
  };

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
    try {
      source?.disconnect();
    } catch {
      // ignore
    }
    try {
      analyser?.disconnect();
    } catch {
      // ignore
    }
    if (ctx && ctx.state !== 'closed') {
      ctx.close().catch(() => undefined);
    }
  };

  return { stream, getLevel, stop };
}
