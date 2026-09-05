import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/Button';
import { Popover } from '../ui/Popover';
import { Spinner } from '../ui/Spinner';
import { apiFetch } from '../../lib/apiFetch';
import { queryKeys } from '../../lib/queryKeys';
import { useSession } from '../../lib/session';
import type { NotificationType } from '../../../../shared/constants';

type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  linkPath: string | null;
  readAt: string | null;
  createdAt: string;
};

type NotificationListResponse = {
  data: NotificationItem[];
  meta: { page: number; pageSize: number; total: number; unread: number };
};

function formatRelative(iso: string): string {
  const diffMs = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.notifications.all({ page: 1, pageSize: 8 }),
    queryFn: () =>
      apiFetch<NotificationListResponse>('/notifications?page=1&pageSize=8'),
    enabled: !!user,
    refetchInterval: 60_000,
  });

  const unread = data?.meta.unread ?? 0;
  const items = data?.data ?? [];

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const markAll = useMutation({
    mutationFn: () =>
      apiFetch('/notifications/read', {
        method: 'POST',
        body: JSON.stringify({ all: true }),
      }),
    onSuccess: invalidate,
  });

  const markOne = useMutation({
    mutationFn: (id: string) =>
      apiFetch('/notifications/read', {
        method: 'POST',
        body: JSON.stringify({ ids: [id] }),
      }),
    onSuccess: invalidate,
  });

  function openItem(n: NotificationItem) {
    if (!n.readAt) markOne.mutate(n.id);
    setOpen(false);
    if (n.linkPath) {
      void navigate({ to: n.linkPath });
    }
  }

  if (!user) return null;

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      align="end"
      className="w-80 max-w-[calc(100vw-2rem)] p-0"
      trigger={
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="border-primary-subtle bg-primary-hover px-2 text-on-primary"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        >
          <Bell className="size-4" />
          {unread > 0 ? (
            <span className="ml-1 rounded-full bg-accent px-2 font-mono text-caption text-on-accent">
              {unread}
            </span>
          ) : null}
        </Button>
      }
    >
      <div className="flex max-h-96 flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <p className="m-0 text-body font-semibold text-text">Notifications</p>
          <button
            type="button"
            className="m-0 cursor-pointer border-0 bg-transparent p-0 text-body-sm text-text-muted hover:text-accent disabled:opacity-50"
            disabled={unread === 0 || markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            Clear all
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : items.length === 0 ? (
            <p className="m-0 px-4 py-8 text-center text-body-sm text-text-muted">
              No notifications yet.
            </p>
          ) : (
            <ul className="m-0 list-none divide-y divide-border p-0">
              {items.map((n) => (
                <li
                  key={n.id}
                  className={n.readAt ? 'bg-surface-raised' : 'bg-accent-subtle/40'}
                >
                  <div className="px-4 py-3">
                    <p className="m-0 text-body-sm font-semibold text-text">{n.title}</p>
                    {n.body ? (
                      <p className="m-0 mt-1 text-body-sm text-text-muted">{n.body}</p>
                    ) : null}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      {n.linkPath ? (
                        <button
                          type="button"
                          className="m-0 cursor-pointer border-0 bg-transparent p-0 text-body-sm text-accent"
                          onClick={() => openItem(n)}
                        >
                          View
                        </button>
                      ) : (
                        <span />
                      )}
                      <span className="font-mono text-caption text-text-muted">
                        {formatRelative(n.createdAt)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border px-4 py-3 text-center">
          <Link
            to="/notifications"
            className="text-body-sm text-accent no-underline hover:underline"
            onClick={() => setOpen(false)}
          >
            See all notifications →
          </Link>
        </div>
      </div>
    </Popover>
  );
}
