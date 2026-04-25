import { LayoutGrid } from 'lucide-react';
import { PillButton } from '@/components/primitives';
import { cn } from '@/lib/cn';

interface SymbolBoardButtonProps {
  onOpen: () => void;
}

export function SymbolBoardButton({ onOpen }: SymbolBoardButtonProps) {
  return (
    <PillButton
      size="lg"
      variant="glass"
      onClick={onOpen}
      fullWidth
      className={cn('relay-home-pill')}
      leftIcon={<LayoutGrid className="h-5 w-5" aria-hidden />}
    >
      Symbol board
    </PillButton>
  );
}
