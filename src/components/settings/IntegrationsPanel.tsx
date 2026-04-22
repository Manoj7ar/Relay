import { useEffect, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { Card, PillButton, Toggle } from '@/components/primitives';
import { useSettings } from '@/contexts/SettingsContext';
import { sendTestSms } from '@/services/twilio';
import { testConnection } from '@/services/smartthings';

type CallStatus =
  | { kind: 'idle' }
  | { kind: 'ok' }
  | { kind: 'fail'; message: string };

const EMERGENCY_PROXY_KEY = 'relay.emergency.proxyUrl';

export function IntegrationsPanel() {
  const { settings, dispatch } = useSettings();
  const { integrations } = settings;
  const [stStatus, setStStatus] = useState<CallStatus>({ kind: 'idle' });
  const [smsStatus, setSmsStatus] = useState<CallStatus>({ kind: 'idle' });
  const [proxyUrl, setProxyUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      setProxyUrl(window.localStorage.getItem(EMERGENCY_PROXY_KEY) ?? '');
    } catch {
      setProxyUrl('');
    }
  }, []);

  const updateProxyUrl = (value: string) => {
    setProxyUrl(value);
    if (typeof window === 'undefined') return;
    try {
      if (value.trim().length === 0) {
        window.localStorage.removeItem(EMERGENCY_PROXY_KEY);
      } else {
        window.localStorage.setItem(EMERGENCY_PROXY_KEY, value.trim());
      }
    } catch {
      // ignore quota / storage errors
    }
  };

  const testSt = async () => {
    setStStatus({ kind: 'idle' });
    try {
      await testConnection(integrations.smartThings.apiKey);
      setStStatus({ kind: 'ok' });
    } catch (err) {
      setStStatus({
        kind: 'fail',
        message: err instanceof Error ? err.message : 'Connection failed.',
      });
    }
  };

  const testSms = async () => {
    setSmsStatus({ kind: 'idle' });
    try {
      await sendTestSms(integrations.twilio.caregiverPhone);
      setSmsStatus({ kind: 'ok' });
    } catch (err) {
      setSmsStatus({
        kind: 'fail',
        message: err instanceof Error ? err.message : 'Send failed.',
      });
    }
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
            className="control-input text-sm"
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
            className="control-input text-sm"
          />
        </label>
        <div className="flex flex-col gap-1">
          <PillButton size="sm" variant="glass" onClick={testSt}>
            Test connection
          </PillButton>
          {stStatus.kind === 'ok' ? (
            <span className="text-sm text-emerald-600">Connected</span>
          ) : stStatus.kind === 'fail' ? (
            <span className="text-[11px] leading-snug text-[var(--danger)]">
              {stStatus.message}
            </span>
          ) : null}
        </div>
      </section>

      <section className="space-y-2">
        <p className="text-sm font-medium">Twilio</p>
        <label className="block text-xs">
          <span className="mb-1 block text-muted">Emergency proxy URL</span>
          <input
            type="url"
            value={proxyUrl}
            onChange={(e) => updateProxyUrl(e.target.value)}
            placeholder="https://your-proxy.example/emergency"
            className="control-input text-sm"
          />
          <span className="mt-1 block text-[10px] leading-snug text-muted">
            Small HTTPS endpoint that forwards to Twilio Voice / SMS. Leave
            blank to keep emergency dispatch in "not configured" state.
          </span>
        </label>
        <label className="block text-xs">
          <span className="mb-1 block text-muted">Caregiver phone</span>
          <input
            type="tel"
            value={integrations.twilio.caregiverPhone}
            onChange={(e) =>
              dispatch({ type: 'SET_CAREGIVER_PHONE', value: e.target.value })
            }
            placeholder="+1 555 555 5555"
            className="control-input text-sm"
          />
        </label>
        <div className="flex flex-col gap-1">
          <PillButton
            size="sm"
            variant="accent"
            onClick={testSms}
            disabled={!integrations.twilio.caregiverPhone}
            leftIcon={<Send className="h-4 w-4" aria-hidden />}
          >
            Send test SMS
          </PillButton>
          {smsStatus.kind === 'ok' ? (
            <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
              <MessageSquare className="h-4 w-4" /> Sent
            </span>
          ) : smsStatus.kind === 'fail' ? (
            <span className="text-[11px] leading-snug text-[var(--danger)]">
              {smsStatus.message}
            </span>
          ) : null}
        </div>
      </section>
    </Card>
  );
}
