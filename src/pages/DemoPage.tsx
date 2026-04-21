import { Gavel } from 'lucide-react';
import { DemoModeToggle } from '@/components/demo/DemoModeToggle';
import { InterpreterModePicker } from '@/components/demo/InterpreterModePicker';
import { ScenarioList } from '@/components/demo/ScenarioList';
import { PillButton } from '@/components/primitives';
import { useJudgeDemo } from '@/contexts/JudgeDemoContext';

export function DemoPage() {
  const { launchWalkthrough } = useJudgeDemo();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden px-3 pt-2">
      <header className="shrink-0 pt-[max(env(safe-area-inset-top),6px)]">
        <h1 className="text-lg font-semibold tracking-tight">Judge Demo</h1>
        <p className="mt-1 line-clamp-2 text-xs text-muted">
          No API keys required. Turn on Demo mode in Settings to disable the
          live mic, then start the walkthrough or any scenario below.
        </p>
      </header>

      <PillButton
        size="lg"
        variant="accent"
        fullWidth
        className="!min-h-14 shrink-0 text-base"
        leftIcon={<Gavel className="h-5 w-5" aria-hidden />}
        onClick={launchWalkthrough}
      >
        Start Judge Demo (breakfast walkthrough)
      </PillButton>

      <div className="shrink-0 space-y-2">
        <DemoModeToggle />
        <InterpreterModePicker />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <ScenarioList />
      </div>
    </div>
  );
}
