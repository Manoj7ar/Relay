import { useCallback, useEffect, useState } from 'react';
import {
  appendEvent,
  clearEvents,
  loadEvents,
  updateEvent,
  type SessionEvent,
} from '@/services/sessionLogService';

const SUBSCRIBERS = new Set<(events: SessionEvent[]) => void>();
let CURRENT_EVENTS: SessionEvent[] | null = null;

function ensureLoaded(): SessionEvent[] {
  if (CURRENT_EVENTS === null) {
    CURRENT_EVENTS = loadEvents();
  }
  return CURRENT_EVENTS;
}

function publish(next: SessionEvent[]): void {
  CURRENT_EVENTS = next;
  SUBSCRIBERS.forEach((fn) => fn(next));
}

/**
 * Hook returning the persisted session log with cross-component sync.
 * One in-memory copy is shared between all consumers.
 */
export function useSessionLog() {
  const [events, setEvents] = useState<SessionEvent[]>(() => ensureLoaded());

  useEffect(() => {
    SUBSCRIBERS.add(setEvents);
    return () => {
      SUBSCRIBERS.delete(setEvents);
    };
  }, []);

  const append = useCallback((ev: SessionEvent) => {
    const next = appendEvent(ensureLoaded(), ev);
    publish(next);
  }, []);

  const update = useCallback((id: string, patch: Partial<SessionEvent>) => {
    const next = updateEvent(ensureLoaded(), id, patch);
    publish(next);
  }, []);

  const clear = useCallback(() => {
    clearEvents();
    publish([]);
  }, []);

  return { events, append, update, clear };
}
