import { LayoutGrid } from 'lucide-react';
import { PillButton } from '@/components/primitives';

interface SymbolBoardButtonProps {
  onOpen: () => void;
}

export function SymbolBoardButton({ onOpen }: SymbolBoardButtonProps) {
  return (
    <PillButton
      size="sm"
      variant="glass"
      onClick={onOpen}
      leftIcon={<LayoutGrid className="h-4 w-4" aria-hidden />}
      className="!min-h-11 justify-start text-sm"
      fullWidth
    >
      Symbol board
    </PillButton>
  );
}
