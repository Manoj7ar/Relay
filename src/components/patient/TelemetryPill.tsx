import { useEffect, useState } from 'react';
import type { InferenceTelemetry } from '@/types/model';
import { cn } from '@/lib/cn';

export interface TelemetryPillProps {
  processing: boolean;
  startedAt: number | null;
  telemetry?: InferenceTelemetry;
  /** Shown when inference finished but no telemetry object (legacy / partial adapters). */
  fallbackLatencyMs?: number;
  /** Sum of `totalTokens` (or prompt+completion) for all completed turns in this session. */
  sessionTokensUsed?: number;
  className?: string;
}

function formatSessionTok(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function buildTelemetryTitle(
  t: InferenceTelemetry,
  sessionTokensUsed: number,
): string {
  const parts: string[] = [];
  if (t.promptTokens != null) parts.push(`prompt ${t.promptTokens}`);
  if (t.completionTokens != null) parts.push(`completion ${t.completionTokens}`);
  if (t.totalTokens != null) parts.push(`total ${t.totalTokens}`);
  parts.push(`wall ${t.wallClockMs} ms`);
  if (t.completionMs != null) parts.push(`gen ${t.completionMs} ms`);
  if (t.tokensPerSecond != null)
    parts.push(`${Math.round(t.tokensPerSecond)} tok/s`);
  if (t.tokenCountsApproximate) parts.push('token counts estimated from text size');
  if (sessionTokensUsed > 0) parts.push(`session total ${sessionTokensUsed} tok`);
  return parts.join(' · ');
}

/** Same shell for running + done: wrap-friendly row, accent emphasis on the lead label. */
const telemetryStrip =
  'inline-flex max-w-full min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-md border border-[var(--accent)]/25 bg-[var(--accent)]/[0.08] px-2.5 py-1 text-[10px] leading-tight text-text shadow-sm';

export function TelemetryPill({
  processing,
  startedAt,
  telemetry,
  fallbackLatencyMs,
  sessionTokensUsed = 0,
  className,
}: TelemetryPillProps) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!processing || startedAt == null) {
      setElapsedMs(0);
      return undefined;
    }
    const tick = () => setElapsedMs(Date.now() - startedAt);
    tick();
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [processing, startedAt]);

  const sessionTail =
    sessionTokensUsed > 0
      ? ` · sess ${formatSessionTok(sessionTokensUsed)} tok`
      : '';

  if (processing && startedAt != null) {
    const sec = elapsedMs / 1000;
    return (
      <div
        className={cn(telemetryStrip, className)}
        role="status"
        aria-label={`Interpreting, ${sec.toFixed(1)} seconds elapsed${
          sessionTokensUsed > 0
            ? `, ${sessionTokensUsed} tokens used so far this session`
            : ''
        }`}
      >
        <span
          className="inline-flex min-w-0 shrink items-center gap-1 text-[var(--accent)]"
          aria-live="polite"
        >
          <span
            className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-[var(--accent)]"
            aria-hidden
          />
          <span className="shrink-0 font-semibold uppercase tracking-wide">
            Running
          </span>
        </span>
        <span className="shrink-0 text-muted/70" aria-hidden>
          ·
        </span>
        <span className="min-w-0 font-mono tabular-nums tracking-normal text-muted">
          {sec.toFixed(1)} s{sessionTail}
        </span>
      </div>
    );
  }

  if (!processing && telemetry) {
    const approx = telemetry.tokenCountsApproximate ? '≈' : '';
    const bits: string[] = [];
    if (telemetry.totalTokens != null) {
      bits.push(`${approx}${telemetry.totalTokens} tok`);
    } else if (telemetry.completionTokens != null) {
      bits.push(`${approx}${telemetry.completionTokens} tok`);
    }
    bits.push(`${(telemetry.wallClockMs / 1000).toFixed(1)} s`);
    if (telemetry.tokensPerSecond != null) {
      bits.push(`${approx}${Math.round(telemetry.tokensPerSecond)} tok/s`);
    }
    const metricsLine = bits.join(' · ') + sessionTail;

    return (
      <div
        className={cn(telemetryStrip, className)}
        title={buildTelemetryTitle(telemetry, sessionTokensUsed)}
      >
        <span className="shrink-0 font-semibold uppercase tracking-wide text-[var(--accent)]">
          Done
        </span>
        <span className="shrink-0 text-muted/70" aria-hidden>
          ·
        </span>
        <span className="min-w-0 font-mono tabular-nums font-semibold tracking-normal normal-case text-muted">
          {metricsLine}
        </span>
      </div>
    );
  }

  if (!processing && fallbackLatencyMs != null) {
    return (
      <div
        className={cn(telemetryStrip, className)}
        title={
          `Inference time ${fallbackLatencyMs} ms` +
          (sessionTokensUsed > 0
            ? ` · session total ${sessionTokensUsed} tok`
            : '')
        }
      >
        <span className="shrink-0 font-semibold uppercase tracking-wide text-[var(--accent)]">
          Latency
        </span>
        <span className="shrink-0 text-muted/70" aria-hidden>
          ·
        </span>
        <span className="min-w-0 font-mono tabular-nums font-semibold tracking-normal text-muted">
          {fallbackLatencyMs} ms{sessionTail}
        </span>
      </div>
    );
  }

  return null;
}
