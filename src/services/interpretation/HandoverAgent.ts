import { uid } from '@/lib/id';
import { getOllamaModel } from '@/lib/ollamaConfig';
import type { HandoverNote, HandoverToolEvent } from '@/types/handover';
import type { RoutingLogEntry } from '@/types/model';
import {
  completeOllamaChatCompletion,
  type OllamaChatRequestMessage,
} from './ollamaApi';
import { getTool, relayTools } from './tools/registry';
import type { RelayToolContext } from './tools/types';

const MAX_TOOL_ROUNDS = 8;

export class HandoverToolCapabilityError extends Error {
  constructor(detail?: string) {
    super(
      [
        'The Ollama model did not complete the handover tool-calling flow.',
        'Confirm VITE_RELAY_OLLAMA_BASE_URL and that the model supports tool calling, then try again.',
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

function toolsForOpenAI() {
  return relayTools.map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.schema,
    },
  }));
}

function normalizeToolArgs(value: unknown): unknown {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return {};
    }
  }
  return value ?? {};
}

function stringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === 'string')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseFinalNote(content: string): HandoverNote | null {
  try {
    const parsed = JSON.parse(
      content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim(),
    ) as Partial<HandoverNote>;
    if (
      typeof parsed.id === 'string' &&
      typeof parsed.shiftStart === 'number' &&
      typeof parsed.shiftEnd === 'number' &&
      typeof parsed.summary === 'string' &&
      Array.isArray(parsed.notableEvents) &&
      Array.isArray(parsed.newSignalsLearned) &&
      Array.isArray(parsed.patternsDetected) &&
      Array.isArray(parsed.flagsForNextCarer) &&
      Array.isArray(parsed.suggestedFollowUps)
    ) {
      return {
        ...(parsed as HandoverNote),
        communicationNotes: stringArray(parsed.communicationNotes),
        accessibilityFlagsForNextCarer: stringArray(
          parsed.accessibilityFlagsForNextCarer,
        ),
        residentPhrasedPriorities: stringArray(parsed.residentPhrasedPriorities),
      };
    }
  } catch {
    return null;
  }
  return null;
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

  const messages: OllamaChatRequestMessage[] = [
    {
      role: 'system',
      content:
        'You are the Relay handover agent. You must call the provided tools to inspect session history, dictionary deltas, alerts, routing, and patterns before writing the final note. Do not invent clinical events or diagnoses. Ground communicationNotes and residentPhrasedPriorities in observed interpretations and dictionary tools (pace, symbols vs speech, successful phrasing). accessibilityFlagsForNextCarer must be non-clinical operational hints only. Finish by calling write_handover_note with every required field including communicationNotes, accessibilityFlagsForNextCarer, residentPhrasedPriorities (arrays of strings; use [] if none).',
    },
    {
      role: 'user',
      content: `You are Relay handover agent using ${getOllamaModel()}.

Generate a structured handover note for ${new Date(shiftStart).toISOString()} through ${new Date(
        shiftEnd,
      ).toISOString()}. Persist the note by calling write_handover_note with the exact fields that tool requires, including communication-centered arrays.`,
    },
  ];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const message = await completeOllamaChatCompletion({
      model: getOllamaModel(),
      messages,
      tools: toolsForOpenAI(),
      tool_choice: 'auto',
      temperature: 0.2,
      max_tokens: 900,
    });

    messages.push({
      role: 'assistant',
      content: message.content ?? null,
      tool_calls: message.tool_calls?.map((tc) => ({
        id: tc.id,
        type: 'function' as const,
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments ?? '{}',
        },
      })),
    });

    const calls = message.tool_calls ?? [];
    if (!calls.length) {
      const note = parseFinalNote(message.content ?? '');
      if (note) return note;
      throw new HandoverToolCapabilityError(
        'Ollama returned no tool calls and no structured note.',
      );
    }

    for (const tc of calls) {
      const name = tc.function.name;
      if (!name) continue;
      const tool = getTool(name);
      if (!tool) throw new HandoverToolCapabilityError(`Unknown tool: ${name}`);

      let args: unknown = {};
      try {
        args = tc.function.arguments
          ? (JSON.parse(tc.function.arguments) as unknown)
          : {};
      } catch {
        args = {};
      }

      emit(onToolEvent, name, 'called', `Calling ${name}`);
      try {
        const result = await tool.handler(normalizeToolArgs(args), context);
        emit(onToolEvent, name, 'completed', `Completed ${name}`);
        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content:
            typeof result === 'string' ? result : JSON.stringify(result ?? null),
        });
        if (name === 'write_handover_note') {
          return result as HandoverNote;
        }
      } catch (err) {
        const summary = err instanceof Error ? err.message : 'Tool failed.';
        emit(onToolEvent, name, 'failed', summary);
        throw err;
      }
    }
  }

  throw new HandoverToolCapabilityError('Tool loop exceeded the maximum rounds.');
}

export function routingEntryFromToolEvent(
  event: HandoverToolEvent,
): RoutingLogEntry {
  return {
    id: uid('rlog'),
    ts: event.ts,
    inputType: 'tool',
    model: 'OLLAMA',
    latencyMs: 0,
    reason: `${event.status}: ${event.summary}`,
    visionUsed: false,
    toolName: event.toolName,
  };
}
