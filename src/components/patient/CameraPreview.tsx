import { useEffect, useRef } from 'react';
import { Aperture, CircleAlert, CircleOff, Loader2 } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';
import { usePermissions } from '@/hooks/usePermissions';
import { useSession } from '@/contexts/SessionContext';
import { useHaptics } from '@/hooks/useHaptics';
import { CAMERA_COPY, type CameraUiState } from '@/lib/micStateCopy';
import { cn } from '@/lib/cn';

interface CameraPreviewProps {
  /** Whether the vision toggle is on. */
  active: boolean;
  onToggleOff: () => void;
  compact?: boolean;
}

/**
 * Small inline preview with capture-for-context action. Only renders when
 * the patient has the vision toggle on and camera permission is granted.
 *
 * The captured frame is stored in `SessionContext.pendingImage`; the next
 * submit() picks it up and passes it (as `imageDataUrl`) into the single
 * `interpret()` call — the Gemma adapter consumes it for multimodal
 * reasoning once wired.
 */
export function CameraPreview({ active, onToggleOff, compact }: CameraPreviewProps) {
  const permissions = usePermissions('camera');
  const camera = useCamera();
  const { setPendingImage, state } = useSession();
  const haptics = useHaptics();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const triedRef = useRef(false);

  useEffect(() => {
    if (!active) {
      if (camera.active) camera.stop();
      triedRef.current = false;
      return;
    }
    if (triedRef.current) return;
    triedRef.current = true;
    (async () => {
      if (permissions.state !== 'granted') {
        const next = await permissions.request();
        if (next !== 'granted') return;
      }
      await camera.start();
    })();
  }, [active, camera, permissions]);

  const bindRef = (el: HTMLVideoElement | null) => {
    videoRef.current = el;
    camera.bindVideo(el);
  };

  const uiState: CameraUiState = (() => {
    if (!camera.supported) return 'camera_unsupported';
    if (permissions.state === 'denied') return 'camera_denied';
    if (!active) return 'camera_off';
    if (permissions.requesting || camera.state === 'requesting_permission') {
      return 'camera_requesting';
    }
    return camera.state === 'active' ? 'camera_on' : 'camera_off';
  })();

  const copy = CAMERA_COPY[uiState];

  const handleCapture = async () => {
    if (!camera.active) return;
    haptics('tap');
    const frame = await camera.capture();
    if (frame) {
      setPendingImage({ dataUrl: frame.dataUrl, capturedAt: frame.ts });
    }
  };

  if (!active) return null;

  if (
    uiState === 'camera_denied' ||
    uiState === 'camera_unsupported' ||
    camera.error
  ) {
    return (
      <div
        role="status"
        className="flex items-center gap-2 rounded-xl2 bg-white/70 px-3 py-2 text-[11px] text-muted"
      >
        <CircleAlert className="h-3.5 w-3.5" aria-hidden />
        <span>
          {uiState === 'camera_unsupported'
            ? copy.hint
            : camera.error?.message ?? copy.hint}
        </span>
        <button
          type="button"
          onClick={onToggleOff}
          className="ms-auto inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-medium"
        >
          <CircleOff className="h-3 w-3" aria-hidden /> Turn off
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-xl2 bg-black/5 p-1.5',
        compact ? 'text-[10px]' : 'text-xs',
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-lg bg-black',
          compact ? 'h-14 w-20' : 'h-16 w-24',
        )}
      >
        {uiState === 'camera_requesting' ? (
          <div className="flex h-full w-full items-center justify-center text-white/80">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          </div>
        ) : (
          <video
            ref={bindRef}
            className="h-full w-full object-cover"
            muted
            playsInline
            aria-label="Camera preview"
          />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium text-text">{copy.label}</span>
        <span className="truncate text-[10px] text-muted">
          {state.pendingImage ? 'Frame captured — ready for next message.' : copy.hint}
        </span>
      </div>
      <button
        type="button"
        onClick={handleCapture}
        disabled={!camera.active}
        className="flex items-center gap-1 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[10px] font-semibold text-white disabled:opacity-60"
        aria-label="Capture context frame"
      >
        <Aperture className="h-3.5 w-3.5" aria-hidden />
        Capture
      </button>
    </div>
  );
}
