import { Cpu } from 'lucide-react';
import { StatusBadge } from '@/components/primitives';
import { MODEL_LABELS, type ModelId } from '@/types/model';

interface ModelChipProps {
  modelId: ModelId;
}

export function ModelChip({ modelId }: ModelChipProps) {
  const meta = MODEL_LABELS[modelId];
  return (
    <StatusBadge
      icon={<Cpu className="h-3.5 w-3.5" aria-hidden />}
      className="text-[11px]"
    >
      {meta.label}
    </StatusBadge>
  );
}
