import { Camera, CameraOff } from 'lucide-react';
import { IconButton } from '@/components/primitives';

interface CameraToggleProps {
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function CameraToggle({ on, onToggle, disabled }: CameraToggleProps) {
  return (
    <IconButton
      onClick={onToggle}
      disabled={disabled}
      label={on ? 'Turn camera off' : 'Turn camera on'}
      variant={on ? 'solid' : 'glass'}
      size="md"
      icon={
        on ? (
          <Camera className="h-5 w-5" aria-hidden />
        ) : (
          <CameraOff className="h-5 w-5" aria-hidden />
        )
      }
    />
  );
}
