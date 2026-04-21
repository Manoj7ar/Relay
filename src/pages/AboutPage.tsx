import { Link } from 'react-router-dom';
import { BookOpen, Cpu, Layers, WifiOff } from 'lucide-react';
import { Card } from '@/components/primitives';

export function AboutPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 pb-6 pt-2">
      <header className="shrink-0 pt-[max(env(safe-area-inset-top),6px)]">
        <h1 className="text-lg font-semibold tracking-tight">Gemma &amp; architecture</h1>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Relay routes inputs through a Gemma-family stack (contracts in code; inference
          mocked locally for the hackathon). The home header shows the active tier via{' '}
          <strong>Model</strong> — same signal as caregiver routing logs.
        </p>
      </header>

      <Card variant="glass-strong" className="p-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Cpu className="h-4 w-4 shrink-0" aria-hidden />
          Model tiers
        </div>
        <ul className="mt-2 space-y-2 text-xs leading-relaxed text-muted">
          <li>
            <strong className="text-text">E2B</strong> — Short speech and low-latency paths
            (see <code className="rounded bg-black/5 px-1">chooseModel</code> in{' '}
            <code className="rounded bg-black/5 px-1">modelRouter.ts</code>).
          </li>
          <li>
            <strong className="text-text">E4B</strong> — Symbol and expanded phrasing;
            fine-tuning hooks live in personalization / Unsloth metrics.
          </li>
          <li>
            <strong className="text-text">27B</strong> — Multimodal (camera + speech),
            high-urgency, or safety-critical routing.
          </li>
        </ul>
      </Card>

      <Card variant="glass-strong" className="p-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Layers className="h-4 w-4 shrink-0" aria-hidden />
          Offline vs future Ollama
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          The PWA shell installs and runs offline (Workbox). Interpretation in this repo
          uses in-browser mocks with realistic latency bands. Wiring to Ollama or a hosted
          Gemma endpoint replaces the <code className="rounded bg-black/5 px-1">infer*</code>{' '}
          functions — no UI rewrite required.
        </p>
      </Card>

      <Card variant="glass-strong" className="p-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
          Proof in the UI
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          <strong className="text-text">Connection</strong> badge, <strong className="text-text">Model</strong>{' '}
          chip (top bar), and Settings → <strong className="text-text">Routing log</strong>{' '}
          show tier choice and reasons after each interpretation.
        </p>
      </Card>

      <Card variant="glass-strong" className="p-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
          Documentation
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          Full seam list and honest &quot;mocked vs real&quot; notes live in{' '}
          <code className="rounded bg-black/5 px-1">docs/GEMMA_AND_INTEGRATIONS.md</code> and{' '}
          <code className="rounded bg-black/5 px-1">docs/ARCHITECTURE.md</code> in the repo.
        </p>
      </Card>

      <Link
        to="/settings"
        className="mt-1 text-center text-sm font-medium text-[var(--accent)]"
      >
        ← Back to Settings
      </Link>
    </div>
  );
}
