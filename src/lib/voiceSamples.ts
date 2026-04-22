/**
 * Minimal IndexedDB helper for onboarding voice calibration samples.
 *
 * Audio blobs live in a dedicated DB (`relay-voice`, store `samples`) so
 * they never hit the ~5MB localStorage quota. Only lightweight metadata
 * (transcript, durationMs, audioKey) is persisted in `relay.settings`.
 */

const DB_NAME = 'relay-voice';
const DB_VERSION = 1;
const STORE = 'samples';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment.'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
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

export async function putSample(key: string, blob: Blob): Promise<void> {
  await withStore<IDBValidKey>('readwrite', (store) => store.put(blob, key));
}

export async function getSample(key: string): Promise<Blob | undefined> {
  try {
    const value = await withStore<Blob | undefined>('readonly', (store) =>
      store.get(key),
    );
    return value instanceof Blob ? value : undefined;
  } catch {
    return undefined;
  }
}

export async function deleteSample(key: string): Promise<void> {
  try {
    await withStore<undefined>('readwrite', (store) => store.delete(key));
  } catch {
    // ignore
  }
}

export async function clearAllSamples(): Promise<void> {
  try {
    await withStore<undefined>('readwrite', (store) => store.clear());
  } catch {
    // ignore
  }
}

/** Turn a Blob into a one-shot playback URL. Caller owns revocation. */
export function createPlaybackUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}
