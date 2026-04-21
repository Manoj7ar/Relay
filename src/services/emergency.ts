/**
 * Emergency dispatch proxy.
 *
 * Posts to a user-configured HTTP endpoint (typically a small Twilio /
 * hospital-hotline proxy) when the patient's interpretation crosses the
 * emergency threshold. The proxy URL and fallback caregiver phone are
 * stored in `localStorage` so the device remains device-local / installable.
 *
 * If either the proxy URL or the phone number is missing we throw
 * `EmergencyNotConnectedError` instead of pretending to dial — the UI
 * surfaces the message in the emergency banner.
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
  constructor(detail?: string) {
    super(
      [
        'Emergency dispatch is not configured.',
        'Set Settings → Integrations → Emergency proxy URL and Caregiver phone.',
        detail,
      ]
        .filter(Boolean)
        .join(' ')
        .trim(),
    );
    this.name = 'EmergencyNotConnectedError';
  }
}

const PROXY_URL_KEY = 'relay.emergency.proxyUrl';
const FALLBACK_PHONE_KEY = 'relay.twilio.phone';
const REQUEST_TIMEOUT_MS = 15_000;

function readStored(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function triggerEmergency(
  payload: EmergencyPayload,
): Promise<EmergencyResult> {
  const proxyUrl = readStored(PROXY_URL_KEY);
  const caregiverPhone =
    payload.caregiverPhone ?? readStored(FALLBACK_PHONE_KEY) ?? '';

  if (!proxyUrl || !caregiverPhone) {
    throw new EmergencyNotConnectedError();
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        to: caregiverPhone,
        message: `RELAY EMERGENCY — Patient said: "${payload.message}" at ${new Date(payload.ts).toLocaleTimeString()}`,
        ts: payload.ts,
      }),
    });

    if (!res.ok) {
      throw new EmergencyNotConnectedError(`HTTP ${res.status}`);
    }

    const data = (await res.json().catch(() => ({}))) as {
      sid?: string;
      callSid?: string;
    };

    return {
      ok: true,
      callSid: data.sid ?? data.callSid ?? 'sent',
      ts: Date.now(),
    };
  } catch (err) {
    if (err instanceof EmergencyNotConnectedError) throw err;
    throw new EmergencyNotConnectedError(
      err instanceof Error ? err.message : undefined,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
