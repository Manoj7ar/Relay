import { LayoutGrid } from 'lucide-react';
import { PillButton } from '@/components/primitives';

interface SymbolBoardButtonProps {
  onOpen: () => void;
}

export function SymbolBoardButton({ onOpen }: SymbolBoardButtonProps) {
  return (
    <PillButton
      size="md"
      variant="glass"
      onClick={onOpen}
      leftIcon={<LayoutGrid className="h-5 w-5" aria-hidden />}
      className="justify-start"
      fullWidth
    >
      Symbol board
    </PillButton>
  );
}
