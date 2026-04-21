import { Camera, CameraOff } from 'lucide-react';
import { IconButton } from '@/components/primitives';

interface CameraToggleProps {
  on: boolean;
  onToggle: () => void;
}

export function CameraToggle({ on, onToggle }: CameraToggleProps) {
  return (
    <IconButton
      onClick={onToggle}
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
