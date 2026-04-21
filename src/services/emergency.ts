// TODO: integrate with Twilio Voice / SMS endpoints through a thin server proxy.

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

export async function triggerEmergency(
  payload: EmergencyPayload,
): Promise<EmergencyResult> {
  await new Promise((r) => setTimeout(r, 400));
  // eslint-disable-next-line no-console
  console.info('[mock emergency] would call Twilio with', payload);
  return { ok: true, callSid: `mock_${Date.now()}`, ts: Date.now() };
}
