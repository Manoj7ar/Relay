import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Download,
  FileUp,
  Library,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { Card, PillButton, StatusBadge } from '@/components/primitives';
import { DictionaryEntryFormModal } from '@/components/dictionary/DictionaryEntryFormModal';
import {
  deleteEntry,
  exportJson,
  importJson,
  listEntries,
  updateEntry,
} from '@/lib/patientDictionary';
import { exportFineTuneJsonl } from '@/lib/fineTuneExport';
import { formatClock } from '@/lib/time';
import type { DictionaryEntry, SignalModality } from '@/types/dictionary';

const MODALITY_FILTERS: Array<SignalModality | 'all'> = [
  'all',
  'vocalization',
  'partial_word',
  'gesture',
  'symbol',
  'compound',
];

function downloadText(filename: string, text: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function PatientDictionaryPanel({ compact }: { compact?: boolean }) {
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('');
  const [modality, setModality] = useState<SignalModality | 'all'>('all');
  const [editing, setEditing] = useState<DictionaryEntry | undefined>();
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const refresh = async () => {
    setEntries(
      await listEntries({
        recent: true,
        modality: modality === 'all' ? undefined : modality,
        search,
        tag,
      }),
    );
  };

  useEffect(() => {
    void refresh();
    // refresh intentionally tracks filters only; mutating calls refresh directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, tag, modality]);

  const allTags = useMemo(
    () => Array.from(new Set(entries.flatMap((entry) => entry.contextTags))).sort(),
    [entries],
  );

  const handleExport = async () => {
    const json = await exportJson();
    downloadText(
      `relay-patient-dictionary-${new Date().toISOString().slice(0, 10)}.json`,
      json,
      'application/json',
    );
  };

  const handleJsonlExport = async () => {
    const jsonl = await exportFineTuneJsonl();
    downloadText(
      `relay-finetune-${new Date().toISOString().slice(0, 10)}.jsonl`,
      jsonl,
      'application/x-ndjson',
    );
    setMessage('Exported local JSONL fine-tuning dataset.');
  };

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const imported = await importJson(await file.text());
      setMessage(`Imported ${imported.length} dictionary entries.`);
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const mergeDuplicates = async () => {
    const groups = new Map<string, DictionaryEntry[]>();
    entries.forEach((entry) => {
      const key = `${entry.modality}:${entry.rawTranscript ?? ''}:${entry.meaning}`.toLowerCase();
      const group = groups.get(key) ?? [];
      group.push(entry);
      groups.set(key, group);
    });

    let merged = 0;
    for (const group of groups.values()) {
      if (group.length < 2) continue;
      const sorted = group.sort((a, b) => a.createdAt - b.createdAt);
      const keep = sorted[0];
      if (!keep) continue;
      const dupes = sorted.slice(1);
      const confirmations = group.reduce((sum, entry) => sum + entry.confirmations, 0);
      const tags = Array.from(new Set(group.flatMap((entry) => entry.contextTags)));
      await updateEntry(keep.id, {
        confirmations,
        contextTags: tags,
        lastSeenAt: Math.max(...group.map((entry) => entry.lastSeenAt)),
      });
      await Promise.all(dupes.map((entry) => deleteEntry(entry.id)));
      merged += dupes.length;
    }

    setMessage(merged ? `Merged ${merged} duplicate entries.` : 'No duplicates found.');
    await refresh();
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
      <Card className={compact ? 'space-y-2 p-3' : 'space-y-3'}>
        <div className="flex items-center justify-between gap-2">
          <p className="inline-flex items-center gap-2 text-sm font-semibold">
            <Library className="h-4 w-4" aria-hidden />
            Patient dictionary
          </p>
          <PillButton
            size="sm"
            className="!min-h-9 px-4 text-xs"
            leftIcon={<Plus className="h-4 w-4" aria-hidden />}
            onClick={() => setAdding(true)}
          >
            Add
          </PillButton>
        </div>

        <label className="flex min-h-[42px] items-center gap-2 rounded-full bg-black/[0.04] px-3 text-sm">
          <Search className="h-4 w-4 text-muted" aria-hidden />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted"
            placeholder="Search signals, meanings, tags"
          />
        </label>

        <div className="flex flex-wrap gap-1">
          {MODALITY_FILTERS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={modality === value}
              onClick={() => setModality(value)}
              className={`min-h-8 rounded-full px-3 text-[11px] font-medium ${
                modality === value
                  ? 'bg-[var(--accent)] text-white'
                  : 'glass text-text'
              }`}
            >
              {value.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1">
          <input
            value={tag}
            onChange={(event) => setTag(event.target.value)}
            className="control-input min-h-9 flex-1 px-3 py-1 text-xs"
            placeholder="Filter by tag"
            list="dictionary-tags"
          />
          <datalist id="dictionary-tags">
            {allTags.map((value) => (
              <option key={value} value={value} />
            ))}
          </datalist>
          <button
            type="button"
            onClick={() => setTag('')}
            className="rounded-full px-3 text-xs font-medium text-muted hover:bg-black/5"
          >
            Clear
          </button>
        </div>

        <div className="flex flex-wrap justify-end gap-1.5">
          <PillButton
            size="sm"
            variant="glass"
            className="!min-h-9 px-4 text-xs"
            onClick={mergeDuplicates}
          >
            Merge duplicates
          </PillButton>
          <PillButton
            size="sm"
            variant="glass"
            className="!min-h-9 px-4 text-xs"
            onClick={() => fileInputRef.current?.click()}
            leftIcon={<FileUp className="h-4 w-4" aria-hidden />}
          >
            Import
          </PillButton>
          <PillButton
            size="sm"
            variant="glass"
            className="!min-h-9 px-4 text-xs"
            onClick={handleExport}
            leftIcon={<Download className="h-4 w-4" aria-hidden />}
          >
            Export
          </PillButton>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(event) => void handleImport(event.target.files?.[0])}
          />
        </div>

        {message ? <p className="text-xs text-muted">{message}</p> : null}
      </Card>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {entries.length ? (
          <ol className="space-y-2">
            {entries.map((entry) => (
              <li key={entry.id}>
                <Card padded={false} className="space-y-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-semibold">
                        {entry.meaning}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted">
                        Last seen {formatClock(entry.lastSeenAt)} · confirmed{' '}
                        {entry.confirmations}x
                      </p>
                    </div>
                    <StatusBadge className="shrink-0 text-[10px]">
                      {entry.modality.replace('_', ' ')}
                    </StatusBadge>
                  </div>
                  {entry.rawTranscript ? (
                    <p className="rounded-xl bg-black/[0.04] px-2.5 py-1.5 text-xs italic text-muted">
                      "{entry.rawTranscript}"
                    </p>
                  ) : null}
                  {entry.imageDataUrl ? (
                    <img
                      src={entry.imageDataUrl}
                      alt=""
                      className="max-h-28 w-full rounded-xl object-cover"
                    />
                  ) : null}
                  {entry.contextTags.length ? (
                    <div className="flex flex-wrap gap-1">
                      {entry.contextTags.map((entryTag) => (
                        <span
                          key={entryTag}
                          className="rounded-full bg-black/[0.04] px-2 py-1 text-[10px] text-muted"
                        >
                          #{entryTag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing(entry)}
                      className="rounded-full px-3 py-1.5 text-xs font-medium hover:bg-black/5"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void deleteEntry(entry.id).then(refresh);
                      }}
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-[var(--danger)] hover:bg-[var(--danger)]/[0.08]"
                    >
                      <Trash2 className="h-3 w-3" aria-hidden />
                      Delete
                    </button>
                  </div>
                </Card>
              </li>
            ))}
          </ol>
        ) : (
          <Card className="flex flex-col items-center gap-2 py-8 text-center">
            <Library className="h-9 w-9 text-muted/70" aria-hidden />
            <p className="text-xs font-medium text-text">No signals saved yet</p>
            <p className="max-w-[280px] text-[11px] leading-snug text-muted">
              Add carer-confirmed meanings here. They stay on this device and are
              injected into Gemma prompts as the patient's own corpus.
            </p>
          </Card>
        )}
      </div>

      <DictionaryEntryFormModal
        open={adding}
        onClose={() => setAdding(false)}
        onSaved={() => void refresh()}
      />
      <DictionaryEntryFormModal
        open={Boolean(editing)}
        entry={editing}
        onClose={() => setEditing(undefined)}
        onSaved={() => void refresh()}
      />
    </div>
  );
}
