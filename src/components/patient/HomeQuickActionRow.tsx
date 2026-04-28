import { ClipboardList, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PillButton } from '@/components/primitives';
import { useHaptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/cn';

interface HomeQuickActionRowProps {
  onOpenSymbolBoard: () => void;
}

/**
 * Compact pair under the transcript: symbols (left) and caregiver log (right).
 */
export function HomeQuickActionRow({ onOpenSymbolBoard }: HomeQuickActionRowProps) {
  const navigate = useNavigate();
  const haptics = useHaptics();

  return (
    <div className="flex w-full shrink-0 gap-2">
      <PillButton
        type="button"
        size="sm"
        variant="glass"
        onClick={() => {
          haptics('tap');
          onOpenSymbolBoard();
        }}
        className={cn('relay-home-pill relay-home-pill-compact min-w-0 flex-1 gap-2')}
        leftIcon={<LayoutGrid className="h-4 w-4" aria-hidden />}
        aria-label="Open symbol board"
      >
        Symbols
      </PillButton>
      <PillButton
        type="button"
        size="sm"
        variant="glass"
        onClick={() => {
          haptics('tap');
          navigate('/caregiver');
        }}
        className={cn('relay-home-pill relay-home-pill-compact min-w-0 flex-1 gap-2')}
        leftIcon={<ClipboardList className="h-4 w-4" aria-hidden />}
        aria-label="Open caregiver view — today’s log and handover"
      >
        Care log
      </PillButton>
    </div>
  );
}
