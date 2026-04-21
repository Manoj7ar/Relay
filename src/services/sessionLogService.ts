/**
 * Persistent event log for interactions.
 *
 * The caregiver "Today" list, routing log, emergency timeline, and
 * handover note all derive from this log. Persisted via `lib/storage`.
 */

import { load, save } from '@/lib/storage';
import type { InterpretationResult } from './interpretationService';

export type SessionEventKind = 'interpretation' | 'emergency' | 'action';

export interface SessionEvent extends InterpretationResult {
  kind: SessionEventKind;
  spoken: boolean;
  cameraUsed: boolean;
  /** Optional user-confirmed action once executed. */
  actionTaken?: string;
  cancelled?: boolean;
  /** Raw (possibly fragmented) transcript, before interpretation. */
  rawTranscript?: string;
  interpreter: 'browser' | 'mock' | 'gemma';
}

const STORAGE_KEY = 'relay.session.events';
const MAX_EVENTS = 200;

export function loadEvents(): SessionEvent[] {
  return load<SessionEvent[]>(STORAGE_KEY, []);
}

export function saveEvents(events: SessionEvent[]): void {
  save(STORAGE_KEY, events.slice(0, MAX_EVENTS));
}

export function appendEvent(events: SessionEvent[], ev: SessionEvent): SessionEvent[] {
  const next = [ev, ...events].slice(0, MAX_EVENTS);
  saveEvents(next);
  return next;
}

export function updateEvent(
  events: SessionEvent[],
  id: string,
  patch: Partial<SessionEvent>,
): SessionEvent[] {
  const next = events.map((e) => (e.id === id ? { ...e, ...patch } : e));
  saveEvents(next);
  return next;
}

export function clearEvents(): void {
  saveEvents([]);
}
