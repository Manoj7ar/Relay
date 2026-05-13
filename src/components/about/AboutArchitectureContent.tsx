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
        title="Relay helps hard-to-understand speech become clear"
        subtitle="A local-first communication PWA for people with ALS, aphasia, dysarthria, Parkinson's, and caregivers who need the next phrase quickly."
      />

      <Card variant="glass-strong" padded={false} className="p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
            <HeartHandshake className="h-5 w-5" aria-hidden />
          </span>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-text">
              Speak, tap a symbol, type, or take a photo. Relay turns that signal
              into a respectful phrase the caregiver can understand and replay.
            </p>
            <p className="text-xs leading-relaxed text-muted">
              The app is built for stressful, real-world moments: fragmented words,
              multilingual homes, low dexterity, urgent needs, and a local-first
              architecture where every AI call stays on your network via Ollama.
            </p>
          </div>
        </div>
      </Card>

      <Card variant="glass-strong" padded={false} className="p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
          Local-first promise
        </div>
        <ul className="mt-2 list-none space-y-2 p-0 text-xs leading-relaxed text-muted">
          <li>Core inference runs against the local Ollama server you configure under Settings → Models &amp; connectivity.</li>
          <li>
            Tap-to-speak prefers the browser's Web Speech API; recorded audio
            only leaves the device when you opt into a local STT sidecar by
            setting{' '}
            <code className="rounded bg-black/5 px-1">VITE_RELAY_LOCAL_STT_URL</code>.
          </li>
          <li>No hosted LLM, analytics, font CDN, telemetry, or avatar fetches in production.</li>
          <li>Dictionary, history, voice samples, and exports stay on device unless the user exports them.</li>
        </ul>
      </Card>

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
            <code className="rounded bg-black/5 px-1">interpret()</code>,{' '}
            <code className="rounded bg-black/5 px-1">GemmaInterpreterAdapter</code>,
            then your configured local Ollama tier (E2B / E4B / 27B).
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
          Local model tiers
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2">
          <div className={cn(inner)}>
            <p className="text-sm font-bold text-text">Local Ollama (Gemma family)</p>
            <p className="mt-1 text-[11px] text-muted">
              The deterministic router picks E2B for short text/speech, E4B for
              symbols and JSON side-tasks, and 27B for compound or vision input.
              Camera frames are inlined as base64 in <code className="rounded bg-black/5 px-1">/api/generate</code>.
            </p>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-muted">
          Single adapter path in{' '}
          <code className="rounded bg-black/5 px-1">
            GemmaInterpreterAdapter.ts
          </code>
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
              PWA shell (Workbox); local Ollama inference works fully offline as
              long as the configured server is reachable on the device or LAN.
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
