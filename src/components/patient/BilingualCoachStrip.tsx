import { useEffect, useState } from 'react';
import { Languages } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PillButton } from '@/components/primitives';
import { fetchBilingualCoachQuestion } from '@/services/interpretation/bilingualCoach';
import { isOllamaConfigured } from '@/lib/ollamaConfig';
import { sessionErrorFromUnknown } from '@/lib/sessionInterpretationError';

interface BilingualCoachStripProps {
  interpretationId: string;
  patientLanguage: string;
  caregiverLanguage: string;
  primaryLine: string;
  partnerLine?: string;
}

export function BilingualCoachStrip({
  interpretationId,
  patientLanguage,
  caregiverLanguage,
  primaryLine,
  partnerLine,
}: BilingualCoachStripProps) {
  const navigate = useNavigate();
  const [question, setQuestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOllamaConfigured()) {
      setQuestion(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void fetchBilingualCoachQuestion({
      patientLanguage,
      caregiverLanguage,
      primaryLine,
      partnerLine,
    })
      .then((q) => {
        if (!cancelled) setQuestion(q);
      })
      .catch((e) => {
        if (!cancelled && import.meta.env.DEV) {
          console.warn('[bilingualCoach]', sessionErrorFromUnknown(e).title);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [interpretationId, patientLanguage, caregiverLanguage, primaryLine, partnerLine]);

  return (
    <div
      role="status"
      className="mt-1 space-y-2 rounded-lg border border-black/[0.06] bg-black/[0.04] px-2 py-2 text-left"
    >
      <p className="text-center text-[11px] font-medium leading-snug text-text">
        Language pairing was uncertain — Relay used mic attribution. Check both
        lines above.
      </p>
      {loading ? (
        <p className="text-center text-[10px] text-muted">Getting a tip…</p>
      ) : question ? (
        <p className="text-center text-[11px] leading-snug text-muted">
          <span className="font-semibold text-text">Try asking: </span>
          {question}
        </p>
      ) : null}
      <PillButton
        type="button"
        size="sm"
        variant="glass"
        className="w-full gap-2 text-xs"
        leftIcon={<Languages className="h-3.5 w-3.5" aria-hidden />}
        onClick={() => navigate('/settings/language')}
      >
        Adjust languages in Settings
      </PillButton>
    </div>
  );
}
