import { Link } from 'react-router-dom';
import { BookOpen, Cpu, Layers, WifiOff } from 'lucide-react';
import { Card } from '@/components/primitives';

export function AboutPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pb-6 pt-2">
      <header className="shrink-0 pt-[max(env(safe-area-inset-top),6px)]">
        <h1 className="text-lg font-semibold tracking-tight">Gemma &amp; architecture</h1>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Relay is a real mobile-web AAC shell — permissions, microphone,
          speech-to-text, text-to-speech, and camera all run on real browser
          APIs. The interpretation layer is a single swap point
          (<code className="rounded bg-black/5 px-1">GemmaInterpreterAdapter</code>)
          that calls your Gemma 4 / Ollama endpoint.
        </p>
      </header>

      <Card variant="glass-strong" className="p-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Layers className="h-4 w-4 shrink-0" aria-hidden />
          Data flow
        </div>
        <pre className="mt-2 overflow-x-auto whitespace-pre text-[10px] leading-relaxed text-text">
{`Patient speaks
      |
      v
  Microphone (getUserMedia)
      |
      v
  SpeechRecognition API  -->  Type-instead sheet
      |                             |
  SessionContext.submit() <---------+
      |
      v
  interpretationService.interpret()
      |
      v
  GemmaInterpreterAdapter
      |
      v
  modelRouter.chooseModel()
      |
      v
  +-----------------------------+
  |  E2B  |  E4B  |  27B        |
  | <2s   | tuned | multimodal  |
  +-----------------------------+
      | (Ollama — URL in Settings, default localhost:11434)
      v
  InterpretationResult
      |
      v
  SessionContext --> TranscriptionCard
      |
      v
  speechSynthesis.speak()
      |
      v
Patient hears their words, clearly`}
        </pre>
      </Card>

      <Card variant="glass-strong" className="p-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Cpu className="h-4 w-4 shrink-0" aria-hidden />
          Model tiers (routing policy)
        </div>
        <ul className="mt-2 space-y-2 text-xs leading-relaxed text-muted">
          <li>
            <strong className="text-text">E2B</strong> — Short speech and
            low-latency paths (see{' '}
            <code className="rounded bg-black/5 px-1">chooseModel</code> in{' '}
            <code className="rounded bg-black/5 px-1">modelRouter.ts</code>).
          </li>
          <li>
            <strong className="text-text">E4B</strong> — Symbol input and
            expanded phrasing.
          </li>
          <li>
            <strong className="text-text">27B</strong> — Multimodal
            (camera + speech), high-urgency, or safety-critical.
          </li>
        </ul>
      </Card>

      <Card variant="glass-strong" className="p-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Layers className="h-4 w-4 shrink-0" aria-hidden />
          Interpretation adapter
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          Every input surface (mic + STT, typed fallback, quick phrases,
          symbols, camera frame) routes through a single{' '}
          <code className="rounded bg-black/5 px-1">interpret(input)</code>{' '}
          call. The adapter body is the only thing to swap — the UI never
          changes.
        </p>
      </Card>

      <Card variant="glass-strong" className="p-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
          Offline shell
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          The PWA shell installs and runs offline (Workbox). Pairing it with a
          local Ollama-hosted Gemma 4 keeps the full pipeline edge-first.
        </p>
      </Card>

      <Card variant="glass-strong" className="p-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
          Documentation
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          The full architecture and Gemma wiring checklist live in{' '}
          <code className="rounded bg-black/5 px-1">docs/ARCHITECTURE.md</code>{' '}
          and{' '}
          <code className="rounded bg-black/5 px-1">
            docs/GEMMA_AND_INTEGRATIONS.md
          </code>{' '}
          in the repo.
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
