import { PlayCircle } from 'lucide-react';
import { Card, PillButton } from '@/components/primitives';
import { DEMO_SCENARIOS, instantiateScenario } from '@/services/demoScenarios';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate } from 'react-router-dom';

export function ScenarioList() {
  const { setInterpretation } = useSession();
  const navigate = useNavigate();

  return (
    <Card className="space-y-3">
      <p className="text-sm font-semibold">Scripted scenarios</p>
      <p className="text-sm text-muted">
        Each scenario drives the same interpretation pipeline so you can
        experience Relay without any real model running.
      </p>
      <ul className="space-y-2">
        {DEMO_SCENARIOS.map((scenario) => (
          <li key={scenario.id}>
            <div className="glass flex items-center justify-between gap-3 rounded-xl2 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-medium">
                  {scenario.title}
                </p>
                <p className="truncate text-xs text-muted">
                  {scenario.description}
                </p>
              </div>
              <PillButton
                size="sm"
                variant="accent"
                leftIcon={<PlayCircle className="h-4 w-4" aria-hidden />}
                onClick={() => {
                  const interp = instantiateScenario(scenario);
                  const reason =
                    scenario.interpretation.visionUsed
                      ? 'Camera + speech → multimodal reasoning.'
                      : scenario.interpretation.urgency === 'HIGH'
                        ? 'High urgency hint → reasoning model.'
                        : scenario.interpretation.inputType === 'symbols'
                          ? 'Symbol input → fine-tuned phrase expansion.'
                          : 'Short speech → real-time inference.';
                  setInterpretation(interp, reason);
                  navigate('/');
                }}
              >
                Play
              </PillButton>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
