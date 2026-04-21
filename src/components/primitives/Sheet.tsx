import { useEffect, type PropsWithChildren } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  className?: string;
}

export function Sheet({
  open,
  onClose,
  title,
  className,
  children,
}: PropsWithChildren<SheetProps>) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          'w-full max-w-mobile glass-strong rounded-t-3xl p-5 safe-bottom animate-slide-up',
          className,
        )}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-black/15" />
        {title ? (
          <h3 className="text-lg font-semibold mb-3">{title}</h3>
        ) : null}
        {children}
      </div>
    </div>,
    document.body,
  );
}
