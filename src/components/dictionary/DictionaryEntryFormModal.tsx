import { useEffect, useState } from 'react';
import { Camera, Save } from 'lucide-react';
import { Modal, PillButton } from '@/components/primitives';
import { addEntry, updateEntry } from '@/lib/patientDictionary';
import type {
  DictionaryEntry,
  NewDictionaryEntry,
  SignalModality,
} from '@/types/dictionary';

const MODALITIES: SignalModality[] = [
  'vocalization',
  'partial_word',
  'gesture',
  'symbol',
  'compound',
];

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function inferInitialModality(initial?: Partial<DictionaryEntry>): SignalModality {
  if (initial?.modality) return initial.modality;
  const channels = [
    initial?.rawTranscript ? 'text' : null,
    initial?.imageDataUrl ? 'image' : null,
    initial?.symbolIds?.length ? 'symbols' : null,
  ].filter(Boolean);
  if (channels.length > 1) return 'compound';
  if (initial?.symbolIds?.length) return 'symbol';
  if (initial?.imageDataUrl) return 'gesture';
  return 'partial_word';
}

interface DictionaryEntryFormModalProps {
  open: boolean;
  onClose: () => void;
  entry?: DictionaryEntry;
  initial?: Partial<DictionaryEntry>;
  title?: string;
  onSaved?: (entry: DictionaryEntry) => void;
}

export function DictionaryEntryFormModal({
  open,
  onClose,
  entry,
  initial,
  title,
  onSaved,
}: DictionaryEntryFormModalProps) {
  const seed = entry ?? initial;
  const [modality, setModality] = useState<SignalModality>(
    inferInitialModality(seed),
  );
  const [rawTranscript, setRawTranscript] = useState(seed?.rawTranscript ?? '');
  const [imageDataUrl, setImageDataUrl] = useState(seed?.imageDataUrl ?? '');
  const [symbolIds, setSymbolIds] = useState(seed?.symbolIds?.join(', ') ?? '');
  const [meaning, setMeaning] = useState(seed?.meaning ?? '');
  const [tags, setTags] = useState(seed?.contextTags?.join(', ') ?? '');
  const [confirmedBy, setConfirmedBy] = useState(seed?.confirmedBy ?? 'self');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const next = entry ?? initial;
    setModality(inferInitialModality(next));
    setRawTranscript(next?.rawTranscript ?? '');
    setImageDataUrl(next?.imageDataUrl ?? '');
    setSymbolIds(next?.symbolIds?.join(', ') ?? '');
    setMeaning(next?.meaning ?? '');
    setTags(next?.contextTags?.join(', ') ?? '');
    setConfirmedBy(next?.confirmedBy ?? 'self');
    setError(null);
  }, [entry, initial, open]);

  const handleImage = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload: NewDictionaryEntry = {
        modality,
        rawTranscript,
        imageDataUrl,
        symbolIds: splitList(symbolIds),
        meaning,
        contextTags: splitList(tags),
        confirmedBy,
      };
      const saved = entry
        ? await updateEntry(entry.id, payload)
        : await addEntry(payload);
      onSaved?.(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save entry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title ?? (entry ? 'Edit signal' : 'Add signal')}
      labelledBy="dictionary-entry-title"
    >
      <div className="space-y-3 px-1">
        <label className="block space-y-1 text-sm font-medium">
          <span>Modality</span>
          <select
            value={modality}
            onChange={(event) => setModality(event.target.value as SignalModality)}
            className="control-input"
          >
            {MODALITIES.map((value) => (
              <option key={value} value={value}>
                {value.replace('_', ' ')}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 text-sm font-medium">
          <span>Raw signal or partial word</span>
          <textarea
            value={rawTranscript}
            onChange={(event) => setRawTranscript(event.target.value)}
            rows={3}
            className="control-textarea"
            placeholder='Example: "wa", "uh", "door"'
          />
        </label>

        <label className="block space-y-1 text-sm font-medium">
          <span>Plain-language meaning</span>
          <textarea
            value={meaning}
            onChange={(event) => setMeaning(event.target.value)}
            rows={3}
            className="control-textarea"
            placeholder="Example: wants water"
          />
        </label>

        <label className="block space-y-1 text-sm font-medium">
          <span>Context tags</span>
          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            className="control-input"
            placeholder="post-meal, morning, pain"
          />
        </label>

        <label className="block space-y-1 text-sm font-medium">
          <span>Symbol ids</span>
          <input
            value={symbolIds}
            onChange={(event) => setSymbolIds(event.target.value)}
            className="control-input"
            placeholder="water, help"
          />
        </label>

        <label className="block space-y-1 text-sm font-medium">
          <span>Confirmed by</span>
          <input
            value={confirmedBy}
            onChange={(event) => setConfirmedBy(event.target.value)}
            className="control-input"
            placeholder="self, spouse, carer name"
          />
        </label>

        <div className="space-y-2 rounded-xl2 border border-black/5 bg-black/[0.03] p-3">
          <label className="flex cursor-pointer items-center justify-between gap-2 text-sm font-medium">
            <span className="inline-flex items-center gap-2">
              <Camera className="h-4 w-4" aria-hidden />
              Attach photo frame
            </span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(event) => handleImage(event.target.files?.[0])}
            />
          </label>
          {imageDataUrl ? (
            <div className="space-y-2">
              <img
                src={imageDataUrl}
                alt="Attached signal frame"
                className="max-h-40 w-full rounded-xl object-cover"
              />
              <button
                type="button"
                onClick={() => setImageDataUrl('')}
                className="text-xs font-medium text-muted underline"
              >
                Remove photo
              </button>
            </div>
          ) : (
            <p className="text-xs text-muted">
              Photos stay in this browser's IndexedDB with the dictionary entry.
            </p>
          )}
        </div>

        {error ? (
          <p role="alert" className="text-sm font-medium text-[var(--danger)]">
            {error}
          </p>
        ) : null}

        <PillButton
          type="button"
          onClick={save}
          disabled={saving || meaning.trim().length === 0}
          fullWidth
          leftIcon={<Save className="h-4 w-4" aria-hidden />}
        >
          {saving ? 'Saving…' : 'Save signal'}
        </PillButton>
      </div>
    </Modal>
  );
}
