/**
 * Twilio messaging integration. Not wired yet — hook up a server proxy
 * in this file and `sendTestSms` + the emergency path start working.
 */

export class TwilioNotConnectedError extends Error {
  constructor() {
    super(
      'Twilio is not configured. Wire the Messaging API via a server ' +
        'proxy in src/services/twilio.ts.',
    );
    this.name = 'TwilioNotConnectedError';
  }
}

export async function sendTestSms(_phone: string): Promise<{
  ok: boolean;
  sid: string;
}> {
  throw new TwilioNotConnectedError();
}
