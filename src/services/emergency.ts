/**
 * Emergency dispatch (Twilio Voice/SMS, RCS, hospital hotline, etc.).
 *
 * Not wired yet. Implement `triggerEmergency` to call a server proxy that
 * places the actual call / sends the actual message. Until then this
 * throws `EmergencyNotConnectedError` so the UI can surface an honest
 * "not configured" state instead of pretending to have dialed.
 */

export interface EmergencyPayload {
  message: string;
  caregiverPhone?: string;
  ts: number;
}

export interface EmergencyResult {
  ok: boolean;
  callSid: string;
  ts: number;
}

export class EmergencyNotConnectedError extends Error {
  constructor() {
    super(
      'Emergency dispatch is not configured. Wire a Twilio (or equivalent) ' +
        'proxy in src/services/emergency.ts.',
    );
    this.name = 'EmergencyNotConnectedError';
  }
}

export async function triggerEmergency(
  _payload: EmergencyPayload,
): Promise<EmergencyResult> {
  throw new EmergencyNotConnectedError();
}
