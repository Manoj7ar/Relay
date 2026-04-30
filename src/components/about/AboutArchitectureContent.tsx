import {
  BookOpen,
  Cpu,
  GitBranch,
  HeartHandshake,
  Plug,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';
import { Card, PageHeader } from '@/components/primitives';
import { cn } from '@/lib/cn';

const inner =
  'rounded-xl2 border border-black/10 bg-white/70 p-2.5 text-xs leading-relaxed';

export function AboutArchitectureContent() {
  return (
    <>
      <PageHeader
        title="Gemma & architecture"
        subtitle="Browser mic, STT, TTS, and camera on real APIs. One path through GemmaInterpreterAdapter to your Ollama endpoint."
      />

      <Card variant="glass-strong" padded={false} className="p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <GitBranch className="h-4 w-4 shrink-0" aria-hidden />
          Data flow
        </div>
        <ul className="mt-2 list-none space-y-2 p-0 text-xs leading-relaxed text-muted">
          <li>
            <span className="font-medium text-text">In — </span>
            Voice, type-in, symbols, and camera feed{' '}
            <code className="rounded bg-black/5 px-1">SessionContext.submit()</code>.
          </li>
          <li>
            <span className="font-medium text-text">Through — </span>
            <code className="rounded bg-black/5 px-1">interpret()</code>, adapter,
            router tier, then Ollama (URL in Settings).
          </li>
          <li>
            <span className="font-medium text-text">Out — </span>
            Transcript UI and{' '}
            <code className="rounded bg-black/5 px-1">speechSynthesis</code> read-back.
          </li>
        </ul>
      </Card>

      <Card variant="glass-strong" padded={false} className="p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Cpu className="h-4 w-4 shrink-0" aria-hidden />
          Model tiers
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className={cn(inner)}>
            <p className="text-sm font-bold text-text">E2B</p>
            <p className="mt-1 text-[11px] text-muted">Short speech, low latency.</p>
          </div>
          <div className={cn(inner)}>
            <p className="text-sm font-bold text-text">E4B</p>
            <p className="mt-1 text-[11px] text-muted">Symbols, expanded phrasing.</p>
          </div>
          <div className={cn(inner)}>
            <p className="text-sm font-bold text-text">27B</p>
            <p className="mt-1 text-[11px] text-muted">
              Multimodal, high urgency, safety-critical.
            </p>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-muted">
          Routing in{' '}
          <code className="rounded bg-black/5 px-1">chooseModel</code> ·{' '}
          <code className="rounded bg-black/5 px-1">modelRouter.ts</code>
        </p>
      </Card>

      <Card variant="glass-strong" padded={false} className="p-4">
        <div className="text-sm font-semibold">Also good to know</div>
        <ul className="mt-2 list-none space-y-2.5 p-0 text-xs leading-relaxed text-muted">
          <li className="flex gap-2">
            <Plug className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text" aria-hidden />
            <span>
              <span className="font-medium text-text">Adapter — </span>
              One <code className="rounded bg-black/5 px-1">interpret(input)</code>
              ; swap the adapter, not the UI.
            </span>
          </li>
          <li className="flex gap-2">
            <WifiOff className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text" aria-hidden />
            <span>
              <span className="font-medium text-text">Offline — </span>
              PWA shell (Workbox); local Ollama keeps the loop edge-first.
            </span>
          </li>
          <li className="flex gap-2">
            <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text" aria-hidden />
            <span>
              <span className="font-medium text-text">Docs — </span>
              <code className="rounded bg-black/5 px-1">docs/ARCHITECTURE.md</code>
              {' · '}
              <code className="rounded bg-black/5 px-1">
                docs/GEMMA_AND_INTEGRATIONS.md
              </code>
            </span>
          </li>
        </ul>
      </Card>
    </>
  );
}
