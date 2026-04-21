import { useStreamingText } from '@/hooks/useStreamingText';
import { cn } from '@/lib/cn';

interface StreamingTextProps {
  text: string;
  className?: string;
  id?: string;
}

export function StreamingText({ text, className, id }: StreamingTextProps) {
  const { shown, isStreaming } = useStreamingText({ text });
  return (
    <p
      id={id}
      aria-live="polite"
      className={cn('leading-tight tracking-tight', className)}
    >
      {shown}
      {isStreaming && (
        <span
          aria-hidden
          className="ms-1 inline-block h-[0.9em] w-[0.5ch] translate-y-[2px] animate-pulse rounded-[2px] bg-[var(--accent)]/80"
        />
      )}
    </p>
  );
}
