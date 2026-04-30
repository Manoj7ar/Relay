import { Camera, LayoutGrid } from 'lucide-react';
import { useRef } from 'react';
import { PillButton } from '@/components/primitives';
import { useHaptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/cn';

interface HomeQuickActionRowProps {
  onOpenSymbolBoard: () => void;
  onPhotoOnly: (dataUrl: string) => void;
}

/**
 * Compact row under the transcript: symbols and photo capture.
 */
export function HomeQuickActionRow({
  onOpenSymbolBoard,
  onPhotoOnly,
}: HomeQuickActionRowProps) {
  const haptics = useHaptics();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handlePhoto = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onPhotoOnly(reader.result);
    };
    reader.readAsDataURL(file);
  };

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
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(event) => {
          handlePhoto(event.target.files?.[0]);
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
        className={cn('relay-home-pill relay-home-pill-compact min-w-0 flex-1 gap-2')}
        leftIcon={<Camera className="h-4 w-4" aria-hidden />}
        aria-label="Take a photo for Relay to suggest a phrase"
      >
        Photo
      </PillButton>
    </div>
  );
}
