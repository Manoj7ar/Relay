import { getAlertLog } from './getAlertLog';
import { getDictionaryDeltas } from './getDictionaryDeltas';
import { getRoutingLog } from './getRoutingLog';
import { getSessionHistory } from './getSessionHistory';
import { summarizePatterns } from './summarizePatterns';
import type { RelayTool } from './types';
import { writeHandoverNote } from './writeHandoverNote';

export const relayTools = [
  getSessionHistory,
  getDictionaryDeltas,
  getAlertLog,
  getRoutingLog,
  summarizePatterns,
  writeHandoverNote,
] as const;

export type RelayToolName = (typeof relayTools)[number]['name'];

export function getTool(name: string): RelayTool<unknown, unknown> | undefined {
  return relayTools.find((tool) => tool.name === name) as
    | RelayTool<unknown, unknown>
    | undefined;
}
