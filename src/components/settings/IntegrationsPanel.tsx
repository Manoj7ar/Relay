import { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { Card, PillButton, Toggle } from '@/components/primitives';
import { useSettings } from '@/contexts/SettingsContext';
import { sendTestSms } from '@/services/twilio';
import { testConnection } from '@/services/smartthings';

export function IntegrationsPanel() {
  const { settings, dispatch } = useSettings();
  const { integrations } = settings;
  const [stStatus, setStStatus] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [smsStatus, setSmsStatus] = useState<'idle' | 'sent'>('idle');

  const testSt = async () => {
    setStStatus('idle');
    const ok = await testConnection(integrations.smartThings.apiKey);
    setStStatus(ok ? 'ok' : 'fail');
  };

  const testSms = async () => {
    setSmsStatus('idle');
    const res = await sendTestSms(integrations.twilio.caregiverPhone);
    if (res.ok) setSmsStatus('sent');
  };

  return (
    <Card padded={false} className="h-full min-h-0 space-y-3 overflow-hidden p-3 text-sm">
      <p className="text-xs font-semibold">Integrations</p>

      <section className="space-y-2">
        <p className="text-sm font-medium">SmartThings</p>
        <Toggle
          label="Enable smart-home control"
          description="Let Relay turn on lights, adjust thermostats, etc."
          checked={integrations.smartThings.enabled}
          onChange={(v) =>
            dispatch({ type: 'SET_SMARTTHINGS_ENABLED', value: v })
          }
        />
        <label className="block text-xs">
          <span className="mb-1 block text-muted">API key</span>
          <input
            type="password"
            value={integrations.smartThings.apiKey}
            onChange={(e) =>
              dispatch({
                type: 'SET_SMARTTHINGS_APIKEY',
                value: e.target.value,
              })
            }
            placeholder="st-xxxxxxxx"
            className="w-full rounded-full bg-white/70 px-3 py-2 text-sm placeholder:text-muted focus:outline-none"
          />
        </label>
        <label className="block text-xs">
          <span className="mb-1 block text-muted">Hub name</span>
          <input
            type="text"
            value={integrations.smartThings.hubName}
            onChange={(e) =>
              dispatch({
                type: 'SET_SMARTTHINGS_HUB',
                value: e.target.value,
              })
            }
            className="w-full rounded-full bg-white/70 px-3 py-2 text-sm placeholder:text-muted focus:outline-none"
          />
        </label>
        <div className="flex items-center gap-2">
          <PillButton size="sm" variant="glass" onClick={testSt}>
            Test connection
          </PillButton>
          {stStatus === 'ok' ? (
            <span className="text-sm text-emerald-600">Connected</span>
          ) : stStatus === 'fail' ? (
            <span className="text-sm text-[var(--danger)]">Failed</span>
          ) : null}
        </div>
      </section>

      <section className="space-y-2">
        <p className="text-sm font-medium">Twilio</p>
        <label className="block text-xs">
          <span className="mb-1 block text-muted">Caregiver phone</span>
          <input
            type="tel"
            value={integrations.twilio.caregiverPhone}
            onChange={(e) =>
              dispatch({ type: 'SET_CAREGIVER_PHONE', value: e.target.value })
            }
            placeholder="+1 555 555 5555"
            className="w-full rounded-full bg-white/70 px-3 py-2 text-sm placeholder:text-muted focus:outline-none"
          />
        </label>
        <div className="flex items-center gap-2">
          <PillButton
            size="sm"
            variant="accent"
            onClick={testSms}
            disabled={!integrations.twilio.caregiverPhone}
            leftIcon={<Send className="h-4 w-4" aria-hidden />}
          >
            Send test SMS
          </PillButton>
          {smsStatus === 'sent' ? (
            <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
              <MessageSquare className="h-4 w-4" /> Sent
            </span>
          ) : null}
        </div>
      </section>
    </Card>
  );
}
