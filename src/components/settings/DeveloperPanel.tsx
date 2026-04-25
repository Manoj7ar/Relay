import { Link } from 'react-router-dom';
import { Card } from '@/components/primitives';

/**
 * Developer / capability-layer info. Surfaces what's wired vs. what's
 * still a stub so the owner can tell at a glance what needs to be
 * connected next.
 */
export function DeveloperPanel() {
  const rows: { label: string; status: 'real' | 'stub'; detail: string }[] = [
    {
      label: 'Microphone capture',
      status: 'real',
      detail: 'getUserMedia + Web Audio AnalyserNode level meter.',
    },
    {
      label: 'Speech-to-text',
      status: 'real',
      detail:
        'Browser Web Speech API. Falls back to the Type instead sheet when unsupported.',
    },
    {
      label: 'Text-to-speech',
      status: 'real',
      detail: 'window.speechSynthesis with language-matched voice.',
    },
    {
      label: 'Camera capture',
      status: 'real',
      detail: 'getUserMedia({ video }) with frame capture for vision context.',
    },
    {
      label: 'Permissions',
      status: 'real',
      detail: 'navigator.permissions (with graceful fallback) + denied recovery copy.',
    },
    {
      label: 'Gemma 4 interpretation',
      status: 'real',
      detail:
        'src/services/interpretation/GemmaInterpreterAdapter.ts — Ollama POST /api/generate; surfaces GemmaNotConnectedError when unreachable.',
    },
    {
      label: 'Emergency dispatch',
      status: 'real',
      detail:
        'src/services/emergency.ts — POST to user-set HTTPS proxy when URL and caregiver phone are configured; otherwise EmergencyNotConnectedError.',
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      <Card padded={false} className="p-3">
        <h2 className="text-sm font-semibold text-text">Capability status</h2>
        <p className="mt-0.5 text-[11px] text-muted">
          What is backed by real browser APIs and local Ollama vs. what still
          needs configuration.
        </p>
        <ul className="mt-2 space-y-1.5">
          {rows.map((row) => (
            <li
              key={row.label}
              className="flex items-start gap-2 rounded-xl2 bg-white/60 px-2.5 py-1.5"
            >
              <span
                className={
                  row.status === 'real'
                    ? 'mt-0.5 inline-flex shrink-0 items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700'
                    : 'mt-0.5 inline-flex shrink-0 items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-800'
                }
              >
                {row.status === 'real' ? 'WIRED' : 'STUB'}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-text">{row.label}</p>
                <p className="text-[11px] leading-snug text-muted">{row.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>
      <Card padded={false} className="p-3">
        <h2 className="text-sm font-semibold text-text">Connect Gemma 4</h2>
        <p className="mt-0.5 text-[11px] leading-snug text-muted">
          Customize <code>interpret()</code> in{' '}
          <code>src/services/interpretation/GemmaInterpreterAdapter.ts</code>{' '}
          (Ollama base URL in Settings, prompts, timeouts). Map the output to{' '}
          <code>InterpretationResult</code>. Every input surface (mic, typed,
          quick phrases, symbols, camera-attached) flows through the same path.
        </p>
        <Link
          to="/about"
          className="mt-2 inline-block text-[11px] font-medium text-[var(--accent)] underline-offset-2 hover:underline"
        >
          Architecture overview →
        </Link>
      </Card>
    </div>
  );
}
