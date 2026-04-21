import { useEffect, type PropsWithChildren } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';
import { cn } from '@/lib/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  className?: string;
  fullScreen?: boolean;
  labelledBy?: string;
}

export function Modal({
  open,
  onClose,
  title,
  className,
  fullScreen = true,
  labelledBy,
  children,
}: PropsWithChildren<ModalProps>) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      className={cn(
        'fixed inset-0 z-50 flex items-stretch justify-center',
        'bg-black/30 backdrop-blur-sm animate-fade-in',
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          'relative w-full mx-auto flex flex-col animate-slide-up',
          fullScreen
            ? 'max-w-mobile h-[100dvh] safe-top safe-bottom safe-x'
            : 'max-w-mobile my-8 rounded-xl2 glass-strong',
          className,
        )}
      >
        <div className="flex items-center justify-between pt-2 pb-4 px-1">
          <h2
            id={labelledBy}
            className="text-xl font-semibold tracking-tight"
          >
            {title}
          </h2>
          <IconButton
            icon={<X className="w-6 h-6" />}
            label="Close"
            variant="glass"
            size="lg"
            onClick={onClose}
          />
        </div>
        <div className="flex-1 overflow-y-auto pb-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
