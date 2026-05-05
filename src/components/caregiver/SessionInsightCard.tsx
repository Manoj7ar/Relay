import { useCallback, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Card, PillButton } from '@/components/primitives';
import { useCaregiverSessionSlices } from '@/hooks/useCaregiverSessionSlices';
import { sessionErrorFromUnknown } from '@/lib/sessionInterpretationError';
import { generateSessionInsight } from '@/services/caregiver/sessionInsight';
import type { SessionInsightPayload } from '@/types/relayAi';
import { isOllamaConfigured } from '@/lib/ollamaConfig';

export function SessionInsightCard() {
  const { today, distressPattern } = useCaregiverSessionSlices();
  const distressSummary = distressPattern
    ? 'Multiple HIGH-urgency interpretations within the last 5 minutes (not cancelled).'
    : undefined;
  const [insight, setInsight] = useState<SessionInsightPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const highCount = today.filter((h) => h.urgency === 'HIGH').length;

  const run = useCallback(async () => {
      if (!isOllamaConfigured()) {
        setError('Add VITE_RELAY_OLLAMA_BASE_URL to enable session insights.');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const next = await generateSessionInsight({
          today,
          highUrgencyCount: highCount,
          distressSummary,
        });
        setInsight(next);
      } catch (e) {
        const surf = sessionErrorFromUnknown(e);
        setError(surf.title);
      } finally {
        setLoading(false);
      }
  }, [today, highCount, distressSummary]);

  return (
    <Card className="shrink-0 space-y-2 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-text">Session insight</p>
          <p className="text-[10px] leading-snug text-muted">
            AI summary from today&apos;s interpreted lines — not medical advice.
          </p>
        </div>
        <PillButton
          type="button"
          size="sm"
          variant="glass"
          className="shrink-0 gap-1.5 px-3 py-2 text-xs"
          disabled={loading}
          onClick={() => void run()}
          leftIcon={
            loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            )
          }
        >
          Refresh
        </PillButton>
      </div>

      {error ? (
        <p className="text-xs text-[var(--danger)]">{error}</p>
      ) : null}

      {!insight && !loading && !error ? (
        <PillButton
          type="button"
          size="sm"
          variant="accent"
          className="w-full text-sm"
          onClick={() => void run()}
        >
          Generate insight
        </PillButton>
      ) : null}

      {insight ? (
        <div className="space-y-2 text-xs leading-snug">
          <p className="font-medium text-text">{insight.headline}</p>
          {insight.watchFor.length > 0 ? (
            <div>
              <p className="mb-0.5 font-semibold text-muted">Watch for</p>
              <ul className="list-inside list-disc text-text">
                {insight.watchFor.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {insight.suggestedQuestions.length > 0 ? (
            <div>
              <p className="mb-0.5 font-semibold text-muted">Try asking</p>
              <ul className="list-inside list-disc text-text">
                {insight.suggestedQuestions.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {insight.continuity.length > 0 ? (
            <div>
              <p className="mb-0.5 font-semibold text-muted">Continuity</p>
              <ul className="list-inside list-disc text-text">
                {insight.continuity.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="text-[10px] text-muted">{insight.disclaimer}</p>
        </div>
      ) : null}
    </Card>
  );
}
