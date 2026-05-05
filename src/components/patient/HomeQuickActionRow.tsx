import { CalendarRange, Camera, LayoutGrid } from 'lucide-react';
import { useRef } from 'react';
import { PillButton } from '@/components/primitives';
import { useHaptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/cn';

interface HomeQuickActionRowProps {
  onOpenSymbolBoard: () => void;
  onPhotoOnly: (dataUrl: string) => void;
  onEnvironmentPhoto: (dataUrl: string) => void;
}

/**
 * Compact row under the transcript: symbols and photo capture.
 */
export function HomeQuickActionRow({
  onOpenSymbolBoard,
  onPhotoOnly,
  onEnvironmentPhoto,
}: HomeQuickActionRowProps) {
  const haptics = useHaptics();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const boardRef = useRef<HTMLInputElement | null>(null);

  const readFile = (file: File | undefined, cb: (dataUrl: string) => void) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') cb(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex w-full shrink-0 flex-wrap gap-2">
      <PillButton
        type="button"
        size="sm"
        variant="glass"
        onClick={() => {
          haptics('tap');
          onOpenSymbolBoard();
        }}
        className={cn(
          'relay-home-pill relay-home-pill-compact min-w-0 flex-1 gap-2 basis-[28%]',
        )}
        leftIcon={<LayoutGrid className="h-4 w-4" aria-hidden />}
        aria-label="Open symbol board"
      >
        Symbols
      </PillButton>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(event) => {
          readFile(event.target.files?.[0], onPhotoOnly);
          event.currentTarget.value = '';
        }}
      />
      <input
        ref={boardRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(event) => {
          readFile(event.target.files?.[0], onEnvironmentPhoto);
          event.currentTarget.value = '';
        }}
      />
      <PillButton
        type="button"
        size="sm"
        variant="glass"
        onClick={() => {
          haptics('tap');
          fileRef.current?.click();
        }}
        className={cn(
          'relay-home-pill relay-home-pill-compact min-w-0 flex-1 gap-2 basis-[28%]',
        )}
        leftIcon={<Camera className="h-4 w-4" aria-hidden />}
        aria-label="Take a photo for Relay to suggest a phrase"
      >
        Photo
      </PillButton>
      <PillButton
        type="button"
        size="sm"
        variant="glass"
        onClick={() => {
          haptics('tap');
          boardRef.current?.click();
        }}
        className={cn(
          'relay-home-pill relay-home-pill-compact min-w-0 flex-1 gap-2 basis-[28%]',
        )}
        leftIcon={<CalendarRange className="h-4 w-4" aria-hidden />}
        aria-label="Photograph a board, menu, or schedule for structured suggestions"
      >
        Board
      </PillButton>
    </div>
  );
}
