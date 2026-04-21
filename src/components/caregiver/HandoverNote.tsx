import { useState } from 'react';
import { ClipboardCheck, Download, FileJson, FileText } from 'lucide-react';
import { Card, PillButton } from '@/components/primitives';
import { useSession } from '@/contexts/SessionContext';
import { formatClock } from '@/lib/time';

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildSummary(
  name: string,
  records: ReturnType<typeof useSession>['state']['history'],
): string {
  if (!records.length) {
    return `Handover summary for ${name}\n\nNo interactions logged today.`;
  }
  const start = new Date(records[records.length - 1]!.ts);
  const end = new Date(records[0]!.ts);
  const total = records.length;
  const highs = records.filter((r) => r.urgency === 'HIGH');
  const emergencies = highs.length;
  const cancelled = highs.filter((r) => r.cancelled).length;
  const moods = records.reduce<Record<string, number>>((acc, r) => {
    acc[r.mood] = (acc[r.mood] ?? 0) + 1;
    return acc;
  }, {});
  const topMood =
    Object.entries(moods).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'calm';
  const models = new Set(records.map((r) => r.model));

  const highlights = records
    .slice(0, 3)
    .map((r) => `- ${formatClock(r.ts)} — ${r.primary} (${r.urgency})`)
    .join('\n');

  return [
    `Handover summary for ${name}`,
    `${start.toDateString()} · ${formatClock(start.getTime())} → ${formatClock(end.getTime())}`,
    '',
    `Interactions: ${total}`,
    `Emergencies: ${emergencies} (${cancelled} cancelled)`,
    `Predominant mood: ${topMood}`,
    `Models used: ${[...models].join(', ')}`,
    '',
    'Highlights:',
    highlights,
  ].join('\n');
}

interface HandoverNoteProps {
  patientName?: string;
  compact?: boolean;
}

export function HandoverNote({
  patientName = 'Maya Singh',
  compact,
}: HandoverNoteProps) {
  const { state } = useSession();
  const [summary, setSummary] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = () => {
    setSummary(buildSummary(patientName, state.history));
    setCopied(false);
  };

  const copy = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  const exportTxt = () => {
    if (!summary) return;
    downloadBlob(
      new Blob([summary], { type: 'text/plain' }),
      `relay-handover-${today}.txt`,
    );
  };

  const exportJson = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      patient: patientName,
      summary: summary || null,
      interactions: state.history.map((r) => ({
        time: new Date(r.ts).toISOString(),
        input: r.rawTranscript,
        interpreted: r.primary,
        confidence: Math.round(r.confidence * 100),
        urgency: r.urgency,
        mood: r.mood,
        model: r.model,
        language: r.detectedLanguage,
        cancelled: Boolean(r.cancelled),
      })),
    };
    downloadBlob(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
      `relay-session-${today}.json`,
    );
  };

  return (
    <Card
      data-print-section="handover"
      className={compact ? 'space-y-2 p-3' : 'space-y-3'}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className={
            compact
              ? 'inline-flex items-center gap-1.5 text-xs font-semibold'
              : 'inline-flex items-center gap-2 text-sm font-semibold'
          }
        >
          <FileText className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />{' '}
          Handover
        </p>
        <PillButton
          size="sm"
          variant="accent"
          className={compact ? '!min-h-9 text-xs' : undefined}
          onClick={generate}
        >
          Generate
        </PillButton>
      </div>
      <textarea
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="Tap Generate for a summary."
        rows={compact ? 5 : 10}
        className={
          compact
            ? 'w-full rounded-xl2 bg-white/70 p-2 text-xs font-mono text-text placeholder:text-muted focus:outline-none'
            : 'w-full rounded-xl2 bg-white/70 p-3 text-sm font-mono text-text placeholder:text-muted focus:outline-none'
        }
      />
      <div className="no-print flex flex-wrap justify-end gap-1.5">
        <PillButton
          size="sm"
          variant="glass"
          onClick={exportJson}
          disabled={state.history.length === 0}
          leftIcon={<FileJson className="h-4 w-4" aria-hidden />}
        >
          Export JSON
        </PillButton>
        <PillButton
          size="sm"
          variant="glass"
          onClick={exportTxt}
          disabled={!summary}
          leftIcon={<Download className="h-4 w-4" aria-hidden />}
        >
          Export .txt
        </PillButton>
        <PillButton
          size="sm"
          variant="glass"
          onClick={copy}
          disabled={!summary}
          leftIcon={<ClipboardCheck className="h-4 w-4" aria-hidden />}
        >
          {copied ? 'Copied' : 'Copy'}
        </PillButton>
      </div>
    </Card>
  );
}
