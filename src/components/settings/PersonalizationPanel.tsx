import { ArrowRight, TrendingUp } from 'lucide-react';
import { Card } from '@/components/primitives';
import { useFineTuning } from '@/contexts/FineTuningContext';

export function PersonalizationPanel() {
  const { baselineAccuracy, currentAccuracy, sampleCount, targetSamples, corrections } =
    useFineTuning();
  const pct = Math.round((sampleCount / targetSamples) * 100);

  return (
    <Card padded={false} className="h-full min-h-0 space-y-2 overflow-hidden p-3">
      <p className="text-xs font-semibold">Personalization · Unsloth</p>

      <div className="rounded-xl2 bg-white/70 p-2">
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted">
              Before
            </p>
            <p className="text-lg font-semibold tabular-nums">
              {Math.round(baselineAccuracy * 100)}%
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted" aria-hidden />
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted">
              After
            </p>
            <p className="text-lg font-semibold tabular-nums text-emerald-700">
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

      <p className="line-clamp-2 text-[10px] text-muted">
        {corrections} corrections · retrained nightly (Unsloth).
      </p>
    </Card>
  );
}
