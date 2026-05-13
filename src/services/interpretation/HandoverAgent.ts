/**
 * Handover note agent — single-shot, local-only.
 *
 * The handover runs as a deterministic local pipeline:
 *   1. Run every Relay tool client-side (history, dictionary deltas, alerts,
 *      routing log, simple pattern summary). All data already lives in
 *      IndexedDB / React state, so no extra network is needed.
 *   2. Hand the collected context to local Ollama in a single
 *      `/api/generate` call (`format: json`) using the 27B tier for richer
 *      reasoning.
 *   3. Persist the structured note via `writeHandoverNote.handler` (still in
 *      `tools/`) so the storage contract is unchanged.
 *
 * `onToolEvent` is preserved as the UI hook for the staged tool-event timeline
 * — events are now emitted around each local data fetch instead of around
 * remote tool calls.
 */

import { uid } from '@/lib/id';
import type { HandoverNote, HandoverToolEvent } from '@/types/handover';
import type { RoutingLogEntry } from '@/types/model';
import { getAlertLog } from './tools/getAlertLog';
import { getDictionaryDeltas } from './tools/getDictionaryDeltas';
import { getRoutingLog } from './tools/getRoutingLog';
import { getSessionHistory } from './tools/getSessionHistory';
import { summarizePatterns } from './tools/summarizePatterns';
import { writeHandoverNote } from './tools/writeHandoverNote';
import type { RelayToolContext } from './tools/types';
import {
  completeOllamaJsonTask,
  parseOllamaJsonObject,
} from './ollamaJson';
import { chooseModel } from '../modelRouter';

const MAX_DICTIONARY_ENTRIES_IN_PROMPT = 20;
const MAX_HISTORY_LINES_IN_PROMPT = 40;

export class HandoverToolCapabilityError extends Error {
  constructor(detail?: string) {
    super(
      [
        'The local model did not return a complete handover note.',
        'Confirm Ollama is reachable in Settings → Models & connectivity, then try again.',
        detail,
      ]
        .filter(Boolean)
        .join(' '),
    );
    this.name = 'HandoverToolCapabilityError';
  }
}

interface GenerateHandoverInput extends RelayToolContext {
  onToolEvent?: (event: HandoverToolEvent) => void;
}

function emit(
  onToolEvent: ((event: HandoverToolEvent) => void) | undefined,
  toolName: string,
  status: HandoverToolEvent['status'],
  summary: string,
): void {
  onToolEvent?.({
    id: uid('tool'),
    ts: Date.now(),
    toolName,
    status,
    summary,
  });
}

function stringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === 'string')
    .map((s) => s.trim())
    .filter(Boolean);
}

interface RawHandoverFields {
  summary?: unknown;
  notableEvents?: unknown;
  newSignalsLearned?: unknown;
  patternsDetected?: unknown;
  flagsForNextCarer?: unknown;
  suggestedFollowUps?: unknown;
  communicationNotes?: unknown;
  accessibilityFlagsForNextCarer?: unknown;
  residentPhrasedPriorities?: unknown;
}

function parseSignals(value: unknown): Array<{ entryId: string; meaning: string }> {
  if (!Array.isArray(value)) return [];
  const out: Array<{ entryId: string; meaning: string }> = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const candidate = item as { entryId?: unknown; meaning?: unknown };
    const entryId =
      typeof candidate.entryId === 'string' ? candidate.entryId.trim() : '';
    const meaning =
      typeof candidate.meaning === 'string' ? candidate.meaning.trim() : '';
    if (entryId && meaning) out.push({ entryId, meaning });
  }
  return out;
}

export async function generateHandoverNote({
  shiftStart,
  shiftEnd,
  sessionHistory,
  routingLog,
  onToolEvent,
}: GenerateHandoverInput): Promise<HandoverNote> {
  const context: RelayToolContext = {
    shiftStart,
    shiftEnd,
    sessionHistory,
    routingLog,
  };

  emit(onToolEvent, 'get_session_history', 'called', 'Reading shift history');
  const history = await getSessionHistory.handler(
    { since: shiftStart, until: shiftEnd },
    context,
  );
  emit(
    onToolEvent,
    'get_session_history',
    'completed',
    `Loaded ${history.length} interpretations`,
  );

  emit(
    onToolEvent,
    'get_dictionary_deltas',
    'called',
    'Reading patient dictionary deltas',
  );
  const dictionaryDeltas = await getDictionaryDeltas.handler(
    { since: shiftStart },
    context,
  );
  emit(
    onToolEvent,
    'get_dictionary_deltas',
    'completed',
    `Found ${dictionaryDeltas.length} dictionary updates`,
  );

  emit(onToolEvent, 'get_alert_log', 'called', 'Reading high-urgency alerts');
  const alerts = await getAlertLog.handler({}, context);
  emit(
    onToolEvent,
    'get_alert_log',
    'completed',
    `Found ${alerts.length} HIGH-urgency events`,
  );

  emit(onToolEvent, 'get_routing_log', 'called', 'Reading routing log');
  const routing = await getRoutingLog.handler({}, context);
  emit(
    onToolEvent,
    'get_routing_log',
    'completed',
    `Loaded ${routing.length} routing rows`,
  );

  emit(onToolEvent, 'summarize_patterns', 'called', 'Detecting shift patterns');
  const patterns = await summarizePatterns.handler({}, context);
  emit(
    onToolEvent,
    'summarize_patterns',
    'completed',
    `Detected ${patterns.length} patterns`,
  );

  const truncatedHistory = history.slice(-MAX_HISTORY_LINES_IN_PROMPT).map((record) => ({
    ts: record.ts,
    primary: (record.primary ?? '').slice(0, 200),
    urgency: record.urgency,
    mood: record.mood,
    inferredSpeaker: record.inferredSpeaker ?? null,
    actionTaken: record.actionTaken ?? null,
    dictionaryMatchIds: record.dictionaryMatchIds ?? [],
  }));

  const compactDictionary = dictionaryDeltas
    .slice(0, MAX_DICTIONARY_ENTRIES_IN_PROMPT)
    .map((entry) => ({
      id: entry.id,
      modality: entry.modality,
      meaning: entry.meaning,
      contextTags: entry.contextTags,
      lastSeenAt: entry.lastSeenAt,
    }));

  const compactAlerts = alerts.map((record) => ({
    ts: record.ts,
    primary: (record.primary ?? '').slice(0, 160),
    mood: record.mood,
    actionTaken: record.actionTaken ?? null,
  }));

  const prompt = `You are the Relay handover agent. Produce a single structured shift note from the provided local data only. Do not invent clinical events or diagnoses. Ground every bullet in the supplied history, dictionary deltas, alerts, routing log, and pattern summary.

Shift window: ${new Date(shiftStart).toISOString()} → ${new Date(shiftEnd).toISOString()}

Compact session history (oldest → newest, max ${MAX_HISTORY_LINES_IN_PROMPT}):
${JSON.stringify(truncatedHistory)}

Patient dictionary updates this shift (max ${MAX_DICTIONARY_ENTRIES_IN_PROMPT}):
${JSON.stringify(compactDictionary)}

HIGH-urgency events:
${JSON.stringify(compactAlerts)}

Pattern hints from non-LLM analysis:
${JSON.stringify(patterns)}

Output ONLY a single JSON object with these fields (no markdown, no commentary):
{
  "summary": "2-4 sentence narrative for the next caregiver",
  "notableEvents": ["short bullet", ...],
  "newSignalsLearned": [{"entryId": "<id from dictionary updates>", "meaning": "<short meaning>"}, ...],
  "patternsDetected": ["short bullet", ...],
  "flagsForNextCarer": ["short bullet", ...],
  "suggestedFollowUps": ["short bullet", ...],
  "communicationNotes": ["pace, symbols vs speech, successful phrasing — non-clinical", ...],
  "accessibilityFlagsForNextCarer": ["operational hints (e.g. mic placement, lighting) — non-clinical", ...],
  "residentPhrasedPriorities": ["short line in the resident's voice tone for continuity", ...]
}
All array fields MUST be present (use [] when there is nothing to report).`;

  emit(onToolEvent, 'write_handover_note', 'called', 'Drafting structured note');

  const tier = chooseModel({ inputType: 'compound' }).model;

  let parsed: RawHandoverFields;
  try {
    parsed = await completeOllamaJsonTask<RawHandoverFields>({
      prompt,
      tier,
      numPredict: 900,
      temperature: 0.2,
      parse: (raw) => parseOllamaJsonObject<RawHandoverFields>(raw),
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : undefined;
    emit(onToolEvent, 'write_handover_note', 'failed', detail ?? 'Model call failed.');
    throw new HandoverToolCapabilityError(detail);
  }

  if (typeof parsed.summary !== 'string' || !parsed.summary.trim()) {
    emit(
      onToolEvent,
      'write_handover_note',
      'failed',
      'Model omitted required handover fields.',
    );
    throw new HandoverToolCapabilityError(
      'Model omitted the required `summary` field.',
    );
  }

  const note = await writeHandoverNote.handler(
    {
      shiftStart,
      shiftEnd,
      summary: parsed.summary,
      notableEvents: stringArray(parsed.notableEvents),
      newSignalsLearned: parseSignals(parsed.newSignalsLearned),
      patternsDetected: stringArray(parsed.patternsDetected),
      flagsForNextCarer: stringArray(parsed.flagsForNextCarer),
      suggestedFollowUps: stringArray(parsed.suggestedFollowUps),
      communicationNotes: stringArray(parsed.communicationNotes),
      accessibilityFlagsForNextCarer: stringArray(
        parsed.accessibilityFlagsForNextCarer,
      ),
      residentPhrasedPriorities: stringArray(parsed.residentPhrasedPriorities),
    },
    context,
  );

  emit(
    onToolEvent,
    'write_handover_note',
    'completed',
    'Handover note saved locally.',
  );

  return note;
}

export function routingEntryFromToolEvent(
  event: HandoverToolEvent,
): RoutingLogEntry {
  return {
    id: uid('rlog'),
    ts: event.ts,
    inputType: 'tool',
    model: '27B',
    latencyMs: 0,
    reason: `${event.status}: ${event.summary}`,
    visionUsed: false,
    toolName: event.toolName,
  };
}
