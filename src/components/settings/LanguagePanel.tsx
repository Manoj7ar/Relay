import { useMemo, useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useSession } from '@/contexts/SessionContext';
import { directionFor } from '@/hooks/useRTL';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { PRIMARY_LANGUAGE_OPTIONS } from '@/lib/relayLanguages';
import { filterVoicesForLanguageTags } from '@/services/speechSynthesisService';
import { cn } from '@/lib/cn';
import {
  SettingsControlCard,
  SettingsSection,
  SettingsStack,
} from '@/components/settings/SettingsShell';

export function LanguagePanel() {
  const { settings, dispatch } = useSettings();
  const { state, dispatch: sessionDispatch } = useSession();
  const tts = useSpeechSynthesis();
  const [showAllTtsVoices, setShowAllTtsVoices] = useState(false);

  const ttsVoiceOptions = useMemo(() => {
    const { primaryLanguage, caregiverLanguage } = settings.language;
    const filtered = filterVoicesForLanguageTags(tts.voices, [
      primaryLanguage,
      caregiverLanguage,
    ]);
    const list =
      showAllTtsVoices || filtered.length === 0 ? tts.voices : filtered;
    return [...list].sort((a, b) => {
      const byLang = a.lang.localeCompare(b.lang);
      if (byLang !== 0) return byLang;
      return a.name.localeCompare(b.name);
    });
  }, [
    tts.voices,
    settings.language.primaryLanguage,
    settings.language.caregiverLanguage,
    showAllTtsVoices,
  ]);

  const savedTtsUri = settings.language.ttsVoiceUri;
  const savedVoiceMissing =
    Boolean(savedTtsUri) &&
    !tts.voices.some((v) => v.voiceURI === savedTtsUri);

  return (
    <SettingsStack>
      <SettingsSection
        title="Detection"
        description="What the browser last heard for the primary language (informational)."
      >
        <SettingsControlCard>
          <p className="text-xs text-muted">Auto-detected primary language</p>
          <p className="mt-1 text-sm font-semibold">
            {state.detectedLanguage}
            <span className="ms-1.5 text-xs font-normal text-muted">
              ({state.direction.toUpperCase()})
            </span>
          </p>
        </SettingsControlCard>
      </SettingsSection>

      <SettingsSection
        title="Configured languages"
        description="Used for interpretation output and text-to-speech voice choice."
      >
        <SettingsControlCard className="space-y-3">
          <label className="block text-xs">
            <span className="mb-1.5 block font-medium text-text">
              Primary language
            </span>
            <select
              value={settings.language.primaryLanguage}
              onChange={(e) => {
                const v = e.target.value;
                dispatch({ type: 'SET_PRIMARY_LANGUAGE', value: v });
                sessionDispatch({
                  type: 'SET_LANGUAGE',
                  language: v,
                  direction: directionFor(v),
                });
              }}
              className="control-select"
            >
              {PRIMARY_LANGUAGE_OPTIONS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs">
            <span className="mb-1.5 block font-medium text-text">
              Caregiver language
            </span>
            <select
              value={settings.language.caregiverLanguage}
              onChange={(e) =>
                dispatch({
                  type: 'SET_CAREGIVER_LANGUAGE',
                  value: e.target.value,
                })
              }
              className="control-select"
            >
              {PRIMARY_LANGUAGE_OPTIONS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex cursor-pointer items-start gap-2 text-xs">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-black/20"
              checked={settings.language.autoAdaptLanguages}
              onChange={(e) =>
                dispatch({
                  type: 'SET_AUTO_ADAPT_LANGUAGES',
                  value: e.target.checked,
                })
              }
            />
            <span>
              <span className="font-medium text-text">
                Auto-update languages
              </span>
              <span className="mt-0.5 block text-muted">
                When Relay is confident about the language in a reply, it can
                adjust the two picks above (same as the home menu).
              </span>
            </span>
          </label>

          <div>
            <span className="mb-1.5 block text-xs font-medium text-text">
              Default mic on this device
            </span>
            <div className="inline-flex rounded-lg border border-black/10 p-0.5">
              <button
                type="button"
                onClick={() =>
                  dispatch({
                    type: 'SET_DEFAULT_MIC_SPEAKER',
                    value: 'patient',
                  })
                }
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium',
                  settings.language.defaultMicSpeaker === 'patient'
                    ? 'bg-[var(--accent)]/20 text-text'
                    : 'text-muted hover:bg-black/[0.04]',
                )}
              >
                Patient / guest
              </button>
              <button
                type="button"
                onClick={() =>
                  dispatch({
                    type: 'SET_DEFAULT_MIC_SPEAKER',
                    value: 'caregiver',
                  })
                }
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium',
                  settings.language.defaultMicSpeaker === 'caregiver'
                    ? 'bg-[var(--accent)]/20 text-text'
                    : 'text-muted hover:bg-black/[0.04]',
                )}
              >
                Partner / nurse
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-muted">
              Use when Relay isn&apos;t sure who spoke. Matches the home
              conversation menu.
            </p>
          </div>

          <label className="block text-xs">
            <span className="mb-1.5 block font-medium text-text">
              Spoken output voice
            </span>
            <select
              className="control-select"
              value={savedTtsUri ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                dispatch({
                  type: 'SET_TTS_VOICE_URI',
                  value: v.length ? v : null,
                });
              }}
            >
              <option value="">Automatic (best match)</option>
              {savedVoiceMissing && savedTtsUri ? (
                <option value={savedTtsUri}>
                  Previously selected (not in current list)
                </option>
              ) : null}
              {ttsVoiceOptions.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[11px] text-muted">
              Uses the device browser voices. Automatic picks a higher-quality
              voice when your OS offers several for the same language.
            </p>
          </label>

          {tts.voices.length > 0 &&
          filterVoicesForLanguageTags(tts.voices, [
            settings.language.primaryLanguage,
            settings.language.caregiverLanguage,
          ]).length < tts.voices.length ? (
            <label className="flex cursor-pointer items-start gap-2 text-xs">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-black/20"
                checked={showAllTtsVoices}
                onChange={(e) => setShowAllTtsVoices(e.target.checked)}
              />
              <span>
                <span className="font-medium text-text">
                  Show all installed voices
                </span>
                <span className="mt-0.5 block text-muted">
                  Off by default: list is limited to your primary and partner
                  languages.
                </span>
              </span>
            </label>
          ) : null}
        </SettingsControlCard>
      </SettingsSection>
    </SettingsStack>
  );
}
