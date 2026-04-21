import { Chip } from '@/components/primitives';

interface InterpretationAlternatesProps {
  alternates: string[];
  onSelect: (alt: string) => void;
}

export function InterpretationAlternates({
  alternates,
  onSelect,
}: InterpretationAlternatesProps) {
  if (!alternates.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {alternates.slice(0, 2).map((alt) => (
        <Chip
          key={alt}
          className="max-w-[min(100%,11rem)] px-2 py-1 text-xs"
          onClick={() => onSelect(alt)}
        >
          {alt}
        </Chip>
      ))}
    </div>
  );
}
