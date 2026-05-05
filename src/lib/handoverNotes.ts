import type { HandoverNote, HandoverNoteExport } from '@/types/handover';

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((x): x is string => typeof x === 'string')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Normalize notes stored before v2 fields existed. */
export function normalizeHandoverNote(raw: HandoverNote): HandoverNote {
  return {
    ...raw,
    communicationNotes: toStringArray(raw.communicationNotes),
    accessibilityFlagsForNextCarer: toStringArray(
      raw.accessibilityFlagsForNextCarer,
    ),
    residentPhrasedPriorities: toStringArray(raw.residentPhrasedPriorities),
  };
}

const DB_NAME = 'relay_handover_notes';
const DB_VERSION = 1;
const STORE = 'notes';
const SHIFT_END_INDEX = 'shiftEnd';

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
      if (store && !store.indexNames.contains(SHIFT_END_INDEX)) {
        store.createIndex(SHIFT_END_INDEX, SHIFT_END_INDEX);
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

export async function putHandoverNote(note: HandoverNote): Promise<HandoverNote> {
  const normalized = normalizeHandoverNote(note);
  await withStore<IDBValidKey>('readwrite', (store) => store.put(normalized));
  return normalized;
}

export async function listHandoverNotes(): Promise<HandoverNote[]> {
  const notes = await withStore<HandoverNote[]>('readonly', (store) =>
    store.getAll(),
  );
  return [...notes]
    .map((n) => normalizeHandoverNote(n))
    .sort((a, b) => b.shiftEnd - a.shiftEnd);
}

export function handoverNoteToMarkdown(note: HandoverNote): string {
  const lines = [
    `# Relay handover note`,
    '',
    `Shift: ${new Date(note.shiftStart).toLocaleString()} → ${new Date(note.shiftEnd).toLocaleString()}`,
    '',
    `## Summary`,
    note.summary,
    '',
    `## Notable events`,
    ...(note.notableEvents.length
      ? note.notableEvents.map((event) => `- ${event}`)
      : ['- None recorded.']),
    '',
    `## New signals learned`,
    ...(note.newSignalsLearned.length
      ? note.newSignalsLearned.map(
          (signal) => `- ${signal.meaning} (${signal.entryId})`,
        )
      : ['- None recorded.']),
    '',
    `## Patterns detected`,
    ...(note.patternsDetected.length
      ? note.patternsDetected.map((pattern) => `- ${pattern}`)
      : ['- None detected.']),
    '',
    `## Flags for next carer`,
    ...(note.flagsForNextCarer.length
      ? note.flagsForNextCarer.map((flag) => `- ${flag}`)
      : ['- None recorded.']),
    '',
    `## Suggested follow-ups`,
    ...(note.suggestedFollowUps.length
      ? note.suggestedFollowUps.map((item) => `- ${item}`)
      : ['- None recorded.']),
    '',
    `## Communication (what worked today)`,
    ...(note.communicationNotes.length
      ? note.communicationNotes.map((item) => `- ${item}`)
      : ['- None recorded.']),
    '',
    `## Accessibility / operational flags for next carer`,
    ...(note.accessibilityFlagsForNextCarer.length
      ? note.accessibilityFlagsForNextCarer.map((item) => `- ${item}`)
      : ['- None recorded.']),
    '',
    `## Resident-voiced priorities`,
    ...(note.residentPhrasedPriorities.length
      ? note.residentPhrasedPriorities.map((item) => `- ${item}`)
      : ['- None recorded.']),
  ];
  return lines.join('\n');
}

export function exportHandoverNoteJson(note: HandoverNote): string {
  const payload: HandoverNoteExport = {
    schema: 'relay.handoverNote.v2',
    exportedAt: new Date().toISOString(),
    note: normalizeHandoverNote(note),
  };
  return JSON.stringify(payload, null, 2);
}
