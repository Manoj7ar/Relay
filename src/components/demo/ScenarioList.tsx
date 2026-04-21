import { PlayCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, PillButton } from '@/components/primitives';
import { DEMO_SCENARIOS } from '@/services/demoScenarios';
import { queueJudgeScenario } from '@/lib/judgeDemoQueue';

export function ScenarioList() {
  const navigate = useNavigate();

  const playScenario = (id: string) => {
    queueJudgeScenario(id);
    navigate('/');
  };

  return (
    <Card padded={false} className="flex h-full min-h-0 flex-col gap-2 p-3">
      <p className="shrink-0 text-xs font-semibold">Scenarios</p>
      <p className="text-[10px] leading-snug text-muted">
        Each run sends you home and plays the phased judge walkthrough: fragment
        → routing → inference → confirm.
      </p>
      <ul className="min-h-0 space-y-1.5 overflow-hidden">
        {DEMO_SCENARIOS.map((scenario) => (
          <li key={scenario.id}>
            <div className="glass flex flex-col gap-1.5 rounded-xl2 p-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{scenario.title}</p>
                <p className="mt-0.5 line-clamp-2 text-[10px] text-muted">
                  {scenario.whatYouWillSee}
                </p>
              </div>
              <PillButton
                size="sm"
                variant="accent"
                className="!min-h-9 shrink-0 px-3 text-xs"
                leftIcon={<PlayCircle className="h-3.5 w-3.5" aria-hidden />}
                onClick={() => playScenario(scenario.id)}
              >
                Play scenario
              </PillButton>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
