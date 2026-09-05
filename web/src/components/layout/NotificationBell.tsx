import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { Button } from '../ui/Button';
import { apiFetch } from '../../lib/apiFetch';
import { queryKeys } from '../../lib/queryKeys';
import { useSession } from '../../lib/session';

type NotificationListResponse = {
  meta: { unread: number };
};

export function NotificationBell() {
  const { user } = useSession();

  const { data } = useQuery({
    queryKey: queryKeys.notifications.all({ page: 1, pageSize: 1 }),
    queryFn: () =>
      apiFetch<NotificationListResponse>('/notifications?page=1&pageSize=1'),
    enabled: !!user,
    refetchInterval: 60_000,
  });

  const unread = data?.meta.unread ?? 0;

  return (
    <Link to="/notifications" className="relative inline-flex no-underline">
      <Button
        variant="secondary"
        size="sm"
        className="border-primary-subtle bg-primary-hover px-2 text-on-primary"
      >
        <Bell className="size-4" />
        {unread > 0 ? (
          <span className="ml-1 rounded-full bg-accent px-2 font-mono text-caption text-on-accent">
            {unread}
          </span>
        ) : null}
      </Button>
    </Link>
  );
}
