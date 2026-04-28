import { uid } from '@/lib/id';
import { getOllamaModelTagForTier } from '@/lib/ollamaModelConfig';
import { getResolvedOllamaBaseUrl } from '@/lib/ollamaUrl';
import type { HandoverNote, HandoverToolEvent } from '@/types/handover';
import type { RoutingLogEntry } from '@/types/model';
import { GemmaNotConnectedError } from './GemmaInterpreterAdapter';
import { getTool, relayTools } from './tools/registry';
import type { RelayToolContext } from './tools/types';

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_TOOL_ROUNDS = 8;

export class HandoverToolCapabilityError extends Error {
  constructor(detail?: string) {
    super(
      [
        'The selected Gemma/Ollama model did not complete the handover tool-calling flow.',
        'Use a local model tag that supports Ollama chat tools, then try again.',
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

interface OllamaToolCall {
  function?: {
    name?: string;
    arguments?: unknown;
  };
}

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_name?: string;
  tool_calls?: OllamaToolCall[];
}

interface OllamaChatResponse {
  message?: OllamaMessage;
  error?: string;
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

function toolsForOllama() {
  return relayTools.map((tool) => ({
    type: 'function',
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

async function callOllamaChat(
  ollamaBase: string,
  model: string,
  messages: OllamaMessage[],
): Promise<OllamaChatResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${ollamaBase}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        stream: false,
        tools: toolsForOllama(),
        messages,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => `HTTP ${res.status}`);
      if (detail.toLowerCase().includes('tool')) {
        throw new HandoverToolCapabilityError(detail);
      }
      throw new GemmaNotConnectedError(ollamaBase, `HTTP ${res.status}: ${detail}`);
    }
    return (await res.json()) as OllamaChatResponse;
  } catch (err) {
    if (
      err instanceof GemmaNotConnectedError ||
      err instanceof HandoverToolCapabilityError
    ) {
      throw err;
    }
    throw new GemmaNotConnectedError(
      ollamaBase,
      err instanceof Error ? err.message : undefined,
    );
  } finally {
    clearTimeout(timeoutId);
  }
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
      return parsed as HandoverNote;
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
  const ollamaBase = getResolvedOllamaBaseUrl();
  const model = getOllamaModelTagForTier('27B');
  const context: RelayToolContext = {
    shiftStart,
    shiftEnd,
    sessionHistory,
    routingLog,
  };
  const messages: OllamaMessage[] = [
    {
      role: 'system',
      content:
        'You are Relay handover agent. You must call the provided tools to inspect session history, dictionary deltas, alerts, routing, and patterns before writing the final note. Do not invent events. Persist the note by calling write_handover_note.',
    },
    {
      role: 'user',
      content: `Generate a structured handover note for ${new Date(
        shiftStart,
      ).toISOString()} through ${new Date(
        shiftEnd,
      ).toISOString()}. Final response must be the exact JSON returned by write_handover_note.`,
    },
  ];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const response = await callOllamaChat(ollamaBase, model, messages);
    if (response.error) throw new HandoverToolCapabilityError(response.error);
    const message = response.message;
    if (!message) throw new HandoverToolCapabilityError('No chat message returned.');

    messages.push(message);
    const calls = message.tool_calls ?? [];
    if (!calls.length) {
      const note = parseFinalNote(message.content);
      if (note) return note;
      throw new HandoverToolCapabilityError(
        'The model returned no tool calls and no structured note.',
      );
    }

    for (const call of calls) {
      const name = call.function?.name;
      if (!name) continue;
      const tool = getTool(name);
      if (!tool) throw new HandoverToolCapabilityError(`Unknown tool: ${name}`);

      emit(onToolEvent, name, 'called', `Calling ${name}`);
      try {
        const result = await tool.handler(normalizeToolArgs(call.function?.arguments), context);
        emit(onToolEvent, name, 'completed', `Completed ${name}`);
        messages.push({
          role: 'tool',
          tool_name: name,
          content: JSON.stringify(result),
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
    model: '27B',
    latencyMs: 0,
    reason: `${event.status}: ${event.summary}`,
    visionUsed: false,
    toolName: event.toolName,
  };
}
