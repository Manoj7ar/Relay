import { useMemo, useState } from 'react';
import {
  ClipboardCheck,
  Download,
  FileJson,
  FileText,
  Share2,
  Wrench,
} from 'lucide-react';
import { Card, PillButton } from '@/components/primitives';
import { useModelRouting } from '@/contexts/ModelRoutingContext';
import { useSession } from '@/contexts/SessionContext';
import { useSettings } from '@/contexts/SettingsContext';
import {
  exportHandoverNoteJson,
  handoverNoteToMarkdown,
} from '@/lib/handoverNotes';
import {
  generateHandoverNote,
  HandoverToolCapabilityError,
} from '@/services/interpretation/HandoverAgent';
import type {
  HandoverNote as HandoverNoteRecord,
  HandoverToolEvent,
} from '@/types/handover';

function downloadText(text: string, filename: string, type: string): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface HandoverNoteProps {
  patientName?: string;
  compact?: boolean;
}

export function HandoverNote({ patientName, compact }: HandoverNoteProps) {
  const { state } = useSession();
  const { routingLog, recordToolInvocation } = useModelRouting();
  const { settings } = useSettings();
  const [note, setNote] = useState<HandoverNoteRecord | null>(null);
  const [toolEvents, setToolEvents] = useState<HandoverToolEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const resolvedName =
    patientName ??
    (settings.profile.fullName.trim() ||
      settings.profile.displayName.trim() ||
      'Patient');

  const summary = useMemo(() => (note ? handoverNoteToMarkdown(note) : ''), [note]);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    setCopied(false);
    setNote(null);
    setToolEvents([]);
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    try {
      const generated = await generateHandoverNote({
        shiftStart: todayStart.getTime(),
        shiftEnd: now,
        sessionHistory: state.history,
        routingLog,
        onToolEvent: (event) => {
          setToolEvents((prev) => [event, ...prev]);
          recordToolInvocation(event);
        },
      });
      setNote(generated);
    } catch (err) {
      const message =
        err instanceof HandoverToolCapabilityError || err instanceof Error
          ? err.message
          : 'Handover generation failed.';
      setError(message);
    } finally {
      setGenerating(false);
    }
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

  const share = async () => {
    if (!summary || !navigator.share) return;
    await navigator.share({
      title: `Relay handover for ${resolvedName}`,
      text: summary,
    });
  };

  const today = new Date().toISOString().slice(0, 10);

  const exportTxt = () => {
    if (!summary) return;
    downloadText(
      summary,
      `relay-handover-${today}.txt`,
      'text/markdown',
    );
  };

  const exportJson = () => {
    if (!note) return;
    downloadText(
      exportHandoverNoteJson(note),
      `relay-session-${today}.json`,
      'application/json',
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
          disabled={generating}
        >
          {generating ? 'Generating…' : 'Generate'}
        </PillButton>
      </div>
      <p className="text-[11px] leading-snug text-muted">
        Uses Ollama tool calling against local session history, dictionary deltas,
        alert log, routing log, and a rule-based pattern tool.
      </p>
      {toolEvents.length ? (
        <div className="max-h-28 space-y-1 overflow-y-auto rounded-xl2 bg-black/[0.04] p-2">
          {toolEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-2 text-[11px] leading-snug"
            >
              <Wrench className="mt-0.5 h-3 w-3 shrink-0 text-muted" aria-hidden />
              <span>
                <strong>{event.toolName}</strong> · {event.summary}
              </span>
            </div>
          ))}
        </div>
      ) : null}
      {error ? (
        <div
          role="alert"
          className="rounded-xl2 border border-[var(--danger)]/30 bg-[var(--danger)]/[0.06] px-2.5 py-2 text-xs text-text"
        >
          {error}
        </div>
      ) : null}
      {note &&
      (note.communicationNotes.length > 0 ||
        note.accessibilityFlagsForNextCarer.length > 0 ||
        note.residentPhrasedPriorities.length > 0) ? (
        <div className="space-y-2 rounded-xl2 border border-black/[0.06] bg-black/[0.03] p-2.5 text-xs leading-snug">
          {note.communicationNotes.length > 0 ? (
            <div>
              <p className="mb-0.5 font-semibold text-text">Communication</p>
              <ul className="list-inside list-disc text-muted">
                {note.communicationNotes.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {note.accessibilityFlagsForNextCarer.length > 0 ? (
            <div>
              <p className="mb-0.5 font-semibold text-text">Next shift flags</p>
              <ul className="list-inside list-disc text-muted">
                {note.accessibilityFlagsForNextCarer.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {note.residentPhrasedPriorities.length > 0 ? (
            <div>
              <p className="mb-0.5 font-semibold text-text">Resident priorities</p>
              <ul className="list-inside list-disc text-muted">
                {note.residentPhrasedPriorities.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
      <textarea
        value={summary}
        readOnly
        placeholder="Tap Generate for a tool-built handover note."
        rows={compact ? 5 : 10}
        className={
          compact
            ? 'control-textarea p-2 text-xs font-mono'
            : 'control-textarea p-3 text-sm font-mono'
        }
      />
      <div className="no-print flex flex-wrap justify-end gap-1.5">
        <PillButton
          size="sm"
          variant="glass"
          onClick={exportJson}
          disabled={!note}
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
          onClick={share}
          disabled={!summary || !navigator.share}
          leftIcon={<Share2 className="h-4 w-4" aria-hidden />}
        >
          Share
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
