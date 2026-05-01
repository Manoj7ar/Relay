import { Link } from 'react-router-dom';
import { AboutArchitectureContent } from '@/components/about/AboutArchitectureContent';

export function AboutPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pb-6 pt-2">
      <AboutArchitectureContent />
      <Link
        to="/settings"
        className="mt-1 inline-flex min-h-11 w-full items-center justify-center rounded-xl py-3 text-center text-sm font-medium text-[var(--accent)] transition-colors hover:bg-black/[0.04] min-[380px]:min-h-0 min-[380px]:py-2"
      >
        ← Back to Settings
      </Link>
    </div>
  );
}
