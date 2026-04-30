import { uid } from '@/lib/id';
import type {
  DictionaryEntry,
  DictionaryExport,
  DictionaryListOptions,
  NewDictionaryEntry,
  SignalModality,
} from '@/types/dictionary';

const DB_NAME = 'relay_patient_dictionary';
const DB_VERSION = 1;
const STORE = 'entries';
const LAST_SEEN_INDEX = 'lastSeenAt';
const MODALITY_INDEX = 'modality';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment.'));
      return;
    }

    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      const store = db.objectStoreNames.contains(STORE)
        ? req.transaction?.objectStore(STORE)
        : db.createObjectStore(STORE, { keyPath: 'id' });

      if (store && !store.indexNames.contains(LAST_SEEN_INDEX)) {
        store.createIndex(LAST_SEEN_INDEX, LAST_SEEN_INDEX);
      }
      if (store && !store.indexNames.contains(MODALITY_INDEX)) {
        store.createIndex(MODALITY_INDEX, MODALITY_INDEX);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });
}

function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T> | Promise<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const store = tx.objectStore(STORE);
        const result = run(store);
        if (result instanceof IDBRequest) {
          result.onsuccess = () => resolve(result.result as T);
          result.onerror = () =>
            reject(result.error ?? new Error('IndexedDB request failed'));
        } else {
          Promise.resolve(result).then(resolve, reject);
        }
        tx.onerror = () =>
          reject(tx.error ?? new Error('IndexedDB transaction failed'));
        tx.onabort = () =>
          reject(tx.error ?? new Error('IndexedDB transaction aborted'));
      }),
  );
}

function normalizeTags(tags: string[]): string[] {
  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0),
    ),
  );
}

function normalizeEntry(input: NewDictionaryEntry): DictionaryEntry {
  const now = Date.now();
  return {
    id: input.id ?? uid('dict'),
    modality: input.modality,
    rawTranscript: input.rawTranscript?.trim() || undefined,
    imageDataUrl: input.imageDataUrl || undefined,
    symbolIds: input.symbolIds?.filter((id) => id.trim().length > 0),
    meaning: input.meaning.trim(),
    contextTags: normalizeTags(input.contextTags),
    confirmedBy: input.confirmedBy.trim() || 'self',
    confirmations: Math.max(1, input.confirmations ?? 1),
    createdAt: input.createdAt ?? now,
    lastSeenAt: input.lastSeenAt ?? now,
  };
}

function requestToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
  });
}

async function getEntry(id: string): Promise<DictionaryEntry | undefined> {
  const value = await withStore<DictionaryEntry | undefined>('readonly', (store) =>
    store.get(id),
  );
  return value;
}

export async function getEntryById(
  id: string,
): Promise<DictionaryEntry | undefined> {
  return getEntry(id);
}

function matchesSearch(entry: DictionaryEntry, search: string): boolean {
  const haystack = [
    entry.meaning,
    entry.rawTranscript,
    entry.modality,
    entry.confirmedBy,
    entry.contextTags.join(' '),
    entry.symbolIds?.join(' '),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(search.toLowerCase());
}

function applyListOptions(
  entries: DictionaryEntry[],
  opts: DictionaryListOptions = {},
): DictionaryEntry[] {
  let filtered = entries;
  if (opts.modality) {
    filtered = filtered.filter((entry) => entry.modality === opts.modality);
  }
  if (opts.tag?.trim()) {
    const tag = opts.tag.trim().toLowerCase();
    filtered = filtered.filter((entry) => entry.contextTags.includes(tag));
  }
  if (opts.search?.trim()) {
    const search = opts.search.trim();
    filtered = filtered.filter((entry) => matchesSearch(entry, search));
  }

  filtered = [...filtered].sort((a, b) =>
    opts.recent ? b.lastSeenAt - a.lastSeenAt : b.createdAt - a.createdAt,
  );

  return typeof opts.limit === 'number' && opts.limit > 0
    ? filtered.slice(0, opts.limit)
    : filtered;
}

export async function addEntry(
  input: NewDictionaryEntry,
): Promise<DictionaryEntry> {
  const entry = normalizeEntry(input);
  if (!entry.meaning) {
    throw new Error('Dictionary entry meaning is required.');
  }
  await withStore<IDBValidKey>('readwrite', (store) => store.put(entry));
  return entry;
}

export async function updateEntry(
  id: string,
  patch: Partial<Omit<DictionaryEntry, 'id' | 'createdAt'>>,
): Promise<DictionaryEntry> {
  const current = await getEntry(id);
  if (!current) throw new Error('Dictionary entry not found.');

  const next: DictionaryEntry = {
    ...current,
    ...patch,
    id,
    createdAt: current.createdAt,
    meaning: patch.meaning?.trim() ?? current.meaning,
    confirmedBy: patch.confirmedBy?.trim() || current.confirmedBy,
    contextTags: patch.contextTags
      ? normalizeTags(patch.contextTags)
      : current.contextTags,
    symbolIds: patch.symbolIds ?? current.symbolIds,
    rawTranscript:
      patch.rawTranscript !== undefined
        ? patch.rawTranscript.trim() || undefined
        : current.rawTranscript,
    lastSeenAt: patch.lastSeenAt ?? Date.now(),
  };

  if (!next.meaning) {
    throw new Error('Dictionary entry meaning is required.');
  }
  await withStore<IDBValidKey>('readwrite', (store) => store.put(next));
  return next;
}

export async function incrementConfirmation(id: string): Promise<void> {
  const current = await getEntry(id);
  if (!current) return;
  await withStore<IDBValidKey>('readwrite', (store) =>
    store.put({
      ...current,
      confirmations: current.confirmations + 1,
      lastSeenAt: Date.now(),
    }),
  );
}

export async function decrementConfirmation(id: string): Promise<void> {
  const current = await getEntry(id);
  if (!current) return;
  await withStore<IDBValidKey>('readwrite', (store) =>
    store.put({
      ...current,
      confirmations: Math.max(1, current.confirmations - 1),
      lastSeenAt: Date.now(),
    }),
  );
}

export async function deleteEntry(id: string): Promise<void> {
  await withStore<undefined>('readwrite', (store) => store.delete(id));
}

export async function listEntries(
  opts: DictionaryListOptions = {},
): Promise<DictionaryEntry[]> {
  const entries = await withStore<DictionaryEntry[]>('readonly', (store) =>
    store.getAll(),
  );
  return applyListOptions(entries, opts);
}

export async function findByModality(
  modality: SignalModality,
  opts: Omit<DictionaryListOptions, 'modality'> = {},
): Promise<DictionaryEntry[]> {
  return listEntries({ ...opts, modality });
}

export async function exportJson(): Promise<string> {
  const payload: DictionaryExport = {
    schema: 'relay.patientDictionary.v1',
    exportedAt: new Date().toISOString(),
    entries: await listEntries({ recent: true }),
  };
  return JSON.stringify(payload, null, 2);
}

function parseImportPayload(json: string): DictionaryEntry[] {
  const parsed = JSON.parse(json) as unknown;
  const entries =
    parsed && typeof parsed === 'object' && 'entries' in parsed
      ? (parsed as { entries?: unknown }).entries
      : parsed;

  if (!Array.isArray(entries)) {
    throw new Error('Dictionary import must contain an entries array.');
  }

  return entries.map((raw) => {
    const item = raw as Partial<DictionaryEntry>;
    if (
      typeof item.id !== 'string' ||
      typeof item.modality !== 'string' ||
      typeof item.meaning !== 'string' ||
      !Array.isArray(item.contextTags) ||
      typeof item.confirmedBy !== 'string' ||
      typeof item.confirmations !== 'number' ||
      typeof item.createdAt !== 'number' ||
      typeof item.lastSeenAt !== 'number'
    ) {
      throw new Error('Dictionary import contains an invalid entry.');
    }

    return normalizeEntry({
      id: item.id,
      modality: item.modality as SignalModality,
      rawTranscript: item.rawTranscript,
      imageDataUrl: item.imageDataUrl,
      symbolIds: item.symbolIds,
      meaning: item.meaning,
      contextTags: item.contextTags,
      confirmedBy: item.confirmedBy,
      confirmations: item.confirmations,
      createdAt: item.createdAt,
      lastSeenAt: item.lastSeenAt,
    });
  });
}

export async function importJson(json: string): Promise<DictionaryEntry[]> {
  const entries = parseImportPayload(json);
  await withStore<void>('readwrite', async (store) => {
    await Promise.all(entries.map((entry) => requestToPromise(store.put(entry))));
  });
  return entries;
}

export async function clearAll(): Promise<void> {
  await withStore<undefined>('readwrite', (store) => store.clear());
}
