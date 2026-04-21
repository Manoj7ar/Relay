/**
 * Centralized copy for mic / camera / TTS states. All UI strings consumed
 * by `PrimaryMicButton`, `TranscriptionCard`, `CameraPreview`, and the
 * top banner live here so a11y + microcopy stay consistent.
 */

export type MicUiState =
  | 'mic_off'
  | 'requesting_permission'
  | 'listening'
  | 'processing'
  | 'transcript_ready'
  | 'unsupported_browser'
  | 'permission_denied'
  | 'speaking'
  | 'speech_ended';

export type CameraUiState =
  | 'camera_off'
  | 'camera_requesting'
  | 'camera_on'
  | 'camera_denied'
  | 'camera_unsupported';

interface MicCopy {
  label: string;
  hint: string;
  ariaLabel: string;
}

export const MIC_COPY: Record<MicUiState, MicCopy> = {
  mic_off: {
    label: 'Tap to speak',
    hint: 'Uses your device microphone.',
    ariaLabel: 'Start speaking',
  },
  requesting_permission: {
    label: 'Waiting for permission…',
    hint: 'Approve the mic prompt in your browser.',
    ariaLabel: 'Requesting microphone permission',
  },
  listening: {
    label: 'Tap to stop',
    hint: 'Listening — speak when ready.',
    ariaLabel: 'Stop recording',
  },
  processing: {
    label: 'Interpreting…',
    hint: 'Reconstructing your message.',
    ariaLabel: 'Processing speech',
  },
  transcript_ready: {
    label: 'Tap to speak again',
    hint: 'Confirm or choose an alternate below.',
    ariaLabel: 'Start a new message',
  },
  speaking: {
    label: 'Speaking…',
    hint: 'Tap Stop to silence.',
    ariaLabel: 'Speaking out loud',
  },
  speech_ended: {
    label: 'Tap to speak again',
    hint: 'Message delivered.',
    ariaLabel: 'Start a new message',
  },
  permission_denied: {
    label: 'Mic blocked — type instead',
    hint: 'Allow microphone access in your browser site settings.',
    ariaLabel: 'Microphone blocked; use Type instead',
  },
  unsupported_browser: {
    label: 'Speech unsupported — type instead',
    hint: 'Your browser does not support voice input. Use Type instead.',
    ariaLabel: 'Speech not supported; use Type instead',
  },
};

export const CAMERA_COPY: Record<CameraUiState, { label: string; hint: string }> = {
  camera_off: {
    label: 'Turn camera on',
    hint: 'Adds visual context to your next message.',
  },
  camera_requesting: {
    label: 'Waiting for permission…',
    hint: 'Approve the camera prompt in your browser.',
  },
  camera_on: {
    label: 'Camera on',
    hint: 'Tap to capture the next frame for context.',
  },
  camera_denied: {
    label: 'Camera blocked',
    hint: 'Enable camera access in your site settings.',
  },
  camera_unsupported: {
    label: 'Camera unavailable',
    hint: 'This browser does not support camera capture.',
  },
};
