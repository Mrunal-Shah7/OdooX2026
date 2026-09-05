import { Link } from '@tanstack/react-router';
import { Button } from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas p-5 text-center">
      <h1 className="m-0 text-h1 font-semibold">Page not found</h1>
      <p className="mt-2 text-text-muted">The route you requested does not exist.</p>
      <Link to="/" className="mt-6">
        <Button variant="accent">Go home</Button>
      </Link>
    </div>
  );
}
