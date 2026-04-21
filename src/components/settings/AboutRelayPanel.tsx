import { Link } from 'react-router-dom';
import { Card } from '@/components/primitives';

export function AboutRelayPanel() {
  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold tracking-tight">About Relay</h2>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        <span className="font-semibold text-text">Powered by Gemma 4.</span> This build
        ships typed routing and inference contracts; responses are mocked in the browser
        until Ollama or your gateway is connected. Model choice is visible on the home
        header and in the routing log.
      </p>
      <Link
        to="/about"
        className="mt-3 inline-block text-sm font-medium text-[var(--accent)] underline-offset-2 hover:underline"
      >
        Gemma &amp; architecture
      </Link>
    </Card>
  );
}
