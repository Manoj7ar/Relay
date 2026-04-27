export type SignalModality =
  | 'vocalization'
  | 'partial_word'
  | 'gesture'
  | 'symbol'
  | 'compound';

export interface DictionaryEntry {
  /** Stable local id. Generated client-side; never depends on a server. */
  id: string;
  modality: SignalModality;
  rawTranscript?: string;
  imageDataUrl?: string;
  symbolIds?: string[];
  meaning: string;
  contextTags: string[];
  confirmedBy: string;
  confirmations: number;
  createdAt: number;
  lastSeenAt: number;
}

export interface DictionaryLookup {
  query: { transcript?: string; imageDataUrl?: string; symbolIds?: string[] };
  matches: Array<{
    entry: DictionaryEntry;
    confidence: number;
    rationale: string;
  }>;
}

export interface DictionaryListOptions {
  modality?: SignalModality;
  tag?: string;
  search?: string;
  limit?: number;
  recent?: boolean;
}

export type NewDictionaryEntry = Omit<
  DictionaryEntry,
  'id' | 'confirmations' | 'createdAt' | 'lastSeenAt'
> &
  Partial<
    Pick<DictionaryEntry, 'id' | 'confirmations' | 'createdAt' | 'lastSeenAt'>
  >;

export interface DictionaryExport {
  schema: 'relay.patientDictionary.v1';
  exportedAt: string;
  entries: DictionaryEntry[];
}
