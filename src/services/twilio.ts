// TODO: call Twilio Messaging API from a tiny server proxy.

export async function sendTestSms(phone: string): Promise<{
  ok: boolean;
  sid: string;
}> {
  await new Promise((r) => setTimeout(r, 500));
  // eslint-disable-next-line no-console
  console.info('[mock twilio] would send test SMS to', phone);
  return { ok: true, sid: `mock_sms_${Date.now()}` };
}
