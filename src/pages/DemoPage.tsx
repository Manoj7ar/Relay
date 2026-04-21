import { DemoModeToggle } from '@/components/demo/DemoModeToggle';
import { ScenarioList } from '@/components/demo/ScenarioList';

export function DemoPage() {
  return (
    <div className="flex flex-col gap-4 px-4 pt-2">
      <header className="safe-top">
        <h1 className="text-xl font-semibold tracking-tight">Demo</h1>
        <p className="text-sm text-muted">
          Experience the full Relay flow without local models.
        </p>
      </header>

      <DemoModeToggle />
      <ScenarioList />
    </div>
  );
}
