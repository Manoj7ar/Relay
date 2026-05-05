import { Cpu } from 'lucide-react';
import { useModelRouting } from '@/contexts/ModelRoutingContext';
import { useSession } from '@/contexts/SessionContext';
import { useSettings } from '@/contexts/SettingsContext';

function approxTokens(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(0, Math.round(words * 1.3));
}

export function PerformanceHud() {
  const { settings } = useSettings();
  const { currentModel, routingLog } = useModelRouting();
  const { state } = useSession();

  if (!settings.developer.performanceHud) return null;

  const latest = state.currentInterpretation;
  const model = latest?.model ?? routingLog[0]?.model ?? currentModel;
  const latencyMs = latest?.latencyMs ?? routingLog[0]?.latencyMs ?? 0;
  const tokenCount = latest ? approxTokens(latest.primary) : 0;
  const tokensPerSec =
    latencyMs > 0 && tokenCount > 0
      ? Math.round((tokenCount / latencyMs) * 1000)
      : 0;

  return (
    <aside
      aria-label="Performance HUD"
      className="performance-hud pointer-events-none fixed bottom-[calc(88px+env(safe-area-inset-bottom,0px))] right-[max(12px,env(safe-area-inset-right))] top-auto z-40 w-[min(164px,calc(100vw-1.5rem))] rounded-2xl border border-black/10 bg-white/85 p-2 text-[clamp(9px,2.6vw,10px)] text-text shadow-lg backdrop-blur-md"
    >
      <div className="mb-1 flex items-center gap-1 font-semibold min-[380px]:gap-1.5">
        <Cpu className="h-3 w-3 shrink-0 min-[380px]:h-3.5 min-[380px]:w-3.5" aria-hidden />
        Local perf
      </div>
      <dl className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-0.5">
        <dt className="text-muted">Model</dt>
        <dd className="font-semibold">{model}</dd>
        <dt className="text-muted">Latency</dt>
        <dd className="tabular-nums">{latencyMs || '—'} ms</dd>
        <dt className="text-muted">Tok/sec est.</dt>
        <dd className="tabular-nums">{tokensPerSec || '—'}</dd>
      </dl>
    </aside>
  );
}
