import { Link } from '@tanstack/react-router';
import { Bell } from 'lucide-react';
import { Button } from '../ui/Button';

export function NotificationBell() {
  return (
    <Link to="/notifications" className="relative inline-flex no-underline">
      <Button variant="secondary" size="sm" className="border-primary-subtle bg-primary-hover px-2 text-on-primary">
        <Bell className="size-4" />
        <span className="ml-1 rounded-full bg-accent px-2 font-mono text-caption text-on-accent">3</span>
      </Button>
    </Link>
  );
}
