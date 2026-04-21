import { Modal } from '@/components/primitives';
import { SYMBOL_BOARD, type SymbolTile } from '@/types/symbol';
import { useSession } from '@/contexts/SessionContext';
import { useHaptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/cn';

interface SymbolBoardOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function SymbolBoardOverlay({ open, onClose }: SymbolBoardOverlayProps) {
  const { submit } = useSession();
  const haptics = useHaptics();

  const handlePick = async (tile: SymbolTile) => {
    haptics('tap');
    onClose();
    await submit({
      inputType: 'symbols',
      symbols: [tile.label],
      transcript: tile.impliedPhrase,
      urgencyHint: tile.urgencyHint,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Symbol board"
      labelledBy="symbol-board-title"
    >
      <p className="mb-4 text-sm text-muted">
        Tap a tile to send that message.
      </p>
      <div
        role="grid"
        aria-label="12 communication symbols"
        className="grid grid-cols-3 grid-rows-4 gap-3"
      >
        {SYMBOL_BOARD.map((tile) => {
          const Icon = tile.icon;
          const isUrgent = tile.urgencyHint === 'HIGH';
          return (
            <button
              key={tile.id}
              role="gridcell"
              onClick={() => handlePick(tile)}
              className={cn(
                'glass aspect-square rounded-[22px] flex flex-col items-center justify-center gap-2 p-2',
                'transition-transform active:scale-95 hover:bg-white/70',
                isUrgent && 'ring-2 ring-[var(--danger)]/40',
              )}
            >
              <Icon className="h-7 w-7" aria-hidden />
              <span className="text-sm font-semibold tracking-tight">
                {tile.label}
              </span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
