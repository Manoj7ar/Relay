import { useEffect, useMemo, useRef, useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useSession } from '@/contexts/SessionContext';
import { formatConversationTailForPrompt } from '@/lib/conversationContext';
import { isOllamaConfigured } from '@/lib/ollamaConfig';
import { fetchPredictivePhrases } from '@/services/interpretation/predictivePhrases';

const TOP_N = 3;
const DEBOUNCE_INTERIM_MS = 420;
const DEBOUNCE_HISTORY_MS = 650;

function timeOfDayLabel(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function usePredictivePhrases() {
  const { state } = useSession();
  const { settings } = useSettings();
  const [phrases, setPhrases] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(0);

  const latestId = state.history[0]?.id ?? null;
  const staticPhrases = useMemo(
    () =>
      settings.profile.personalPhrases
        .map((p) => p.trim())
        .filter(Boolean)
        .slice(0, TOP_N),
    [settings.profile.personalPhrases],
  );

  useEffect(() => {
    if (!settings.relayPowerOn) {
      setPhrases([]);
      return;
    }

    if (state.isProcessing) {
      return;
    }

    if (!latestId) {
      setPhrases(staticPhrases);
      return;
    }

    if (!isOllamaConfigured()) {
      setPhrases(staticPhrases);
      return;
    }

    const tail = formatConversationTailForPrompt(state.history);
    const last = state.history[0];
    const partial =
      state.isListening && state.interimTranscript.trim()
        ? state.interimTranscript.trim()
        : undefined;
    const delay = partial ? DEBOUNCE_INTERIM_MS : DEBOUNCE_HISTORY_MS;
    const runId = ++abortRef.current;

    const timer = window.setTimeout(() => {
      setLoading(true);
      void fetchPredictivePhrases({
        conversationTail: tail,
        lastPrimary: last?.primary,
        lastMood: last?.mood,
        lastUrgency: last?.urgency,
        personalPhrases: settings.profile.personalPhrases,
        patientLanguage: settings.language.primaryLanguage,
        caregiverLanguage: settings.language.caregiverLanguage,
        timeOfDay: timeOfDayLabel(),
        partialTranscript: partial,
      })
        .then((next) => {
          if (abortRef.current !== runId) return;
          const trimmed = next
            .map((p) => p.trim())
            .filter(Boolean)
            .slice(0, TOP_N);
          setPhrases(trimmed.length > 0 ? trimmed : staticPhrases);
        })
        .catch(() => {
          if (abortRef.current !== runId) return;
          setPhrases(staticPhrases);
        })
        .finally(() => {
          if (abortRef.current === runId) setLoading(false);
        });
    }, delay);

    return () => {
      window.clearTimeout(timer);
      abortRef.current += 1;
    };
  }, [
    latestId,
    settings.relayPowerOn,
    settings.profile.personalPhrases,
    settings.language.primaryLanguage,
    settings.language.caregiverLanguage,
    state.isProcessing,
    state.isListening,
    state.interimTranscript,
    state.history,
    staticPhrases,
  ]);

  return { phrases, loading, staticFallback: staticPhrases };
}
