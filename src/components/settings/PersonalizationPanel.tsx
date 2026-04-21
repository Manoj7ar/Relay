import { ArrowRight, TrendingUp } from 'lucide-react';
import { Card } from '@/components/primitives';
import { useFineTuning } from '@/contexts/FineTuningContext';

export function PersonalizationPanel() {
  const { baselineAccuracy, currentAccuracy, sampleCount, targetSamples, corrections } =
    useFineTuning();
  const pct = Math.round((sampleCount / targetSamples) * 100);

  return (
    <Card className="space-y-4">
      <p className="text-sm font-semibold">Personalization · Unsloth fine-tune</p>

      <div className="rounded-xl2 bg-white/70 p-4">
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-wider text-muted">
              Before
            </p>
            <p className="text-2xl font-semibold tabular-nums">
              {Math.round(baselineAccuracy * 100)}%
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted" aria-hidden />
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-wider text-muted">
              After
            </p>
            <p className="text-2xl font-semibold tabular-nums text-emerald-700">
              {Math.round(currentAccuracy * 100)}%
            </p>
          </div>
          <div className="ms-auto inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700">
            <TrendingUp className="h-3.5 w-3.5" aria-hidden />
            +{Math.round((currentAccuracy - baselineAccuracy) * 100)}%
          </div>
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
          <span>
            Gathering personal speech data · {sampleCount} of {targetSamples}
          </span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-[width]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <p className="text-xs text-muted">
        {corrections} corrections recorded so far. The model is retrained on-device
        nightly using Unsloth.
      </p>
    </Card>
  );
}
