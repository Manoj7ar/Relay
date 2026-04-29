import { Link } from 'react-router-dom';
import { AboutArchitectureContent } from '@/components/about/AboutArchitectureContent';

export function AboutPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pb-6 pt-2">
      <AboutArchitectureContent />
      <Link
        to="/settings"
        className="mt-1 text-center text-sm font-medium text-[var(--accent)]"
      >
        ← Back to Settings
      </Link>
    </div>
  );
}
