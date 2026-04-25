import { useEffect, useState } from 'react';
import { Card } from '@/components/primitives';
import { useSettings } from '@/contexts/SettingsContext';

const EMERGENCY_PROXY_KEY = 'relay.emergency.proxyUrl';

export function IntegrationsPanel() {
  const { settings, dispatch } = useSettings();
  const { integrations } = settings;
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

  return (
    <Card
      padded={false}
      className="h-full min-h-0 space-y-3 overflow-hidden p-3 text-sm"
    >
      <p className="text-xs font-semibold">Emergency</p>
      <p className="text-[11px] leading-snug text-muted">
        When an interpretation is marked high urgency, Relay can POST a JSON
        payload to an HTTPS endpoint you control (for SMS, voice bridge, or
        paging). Only set a URL you trust.
      </p>

      <label className="block text-xs">
        <span className="mb-1 block text-muted">Emergency proxy URL</span>
        <input
          type="url"
          value={proxyUrl}
          onChange={(e) => updateProxyUrl(e.target.value)}
          placeholder="https://your-server.example/relay-emergency"
          className="control-input text-sm"
        />
      </label>
      <label className="block text-xs">
        <span className="mb-1 block text-muted">Caregiver phone</span>
        <input
          type="tel"
          value={integrations.caregiverPhone}
          onChange={(e) =>
            dispatch({ type: 'SET_CAREGIVER_PHONE', value: e.target.value })
          }
          placeholder="+1 555 555 5555"
          className="control-input text-sm"
        />
        <span className="mt-1 block text-[10px] leading-snug text-muted">
          Sent in the POST body as <code className="rounded bg-black/5 px-1">to</code>
          alongside the patient message. Leave blank if you are not using
          emergency dispatch.
        </span>
      </label>
    </Card>
  );
}
