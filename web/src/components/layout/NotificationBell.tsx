import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/Button';
import { Popover } from '../ui/Popover';
import { Skeleton } from '../ui/Skeleton';
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

  const { data, isError, isLoading, refetch } = useQuery({
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
      className="notification-popover p-0"
      trigger={
        <button
          type="button"
          className="notification-trigger"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        >
          <Bell className="size-5" aria-hidden="true" />
          {unread > 0 ? (
            <span className="notification-trigger__count" aria-hidden="true">
              {unread}
            </span>
          ) : null}
        </button>
      }
    >
      <div className="notification-panel">
        <div className="notification-panel__header">
          <div>
            <p className="notification-panel__title">Notifications</p>
            <p className="notification-panel__summary">
              {unread > 0 ? (
                <>
                  <span className="font-mono">{unread}</span> unread
                </>
              ) : (
                'You are all caught up'
              )}
            </p>
          </div>
          <button
            type="button"
            className="notification-panel__mark-all"
            disabled={unread === 0 || markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            {markAll.isPending ? 'Marking…' : 'Mark all read'}
          </button>
        </div>

        <div className="notification-panel__list-wrap">
          {isLoading ? (
            <div className="notification-skeleton" aria-label="Loading notifications">
              <Skeleton className="skeleton--text" />
              <Skeleton className="skeleton--text" />
              <Skeleton className="skeleton--text" />
            </div>
          ) : isError ? (
            <div className="notification-panel__state">
              <Bell className="size-5 text-text-muted" aria-hidden="true" />
              <p>Couldn’t load notifications.</p>
              <Button variant="secondary" size="sm" onClick={() => void refetch()}>
                Try again
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="notification-panel__state">
              <Bell className="size-5 text-text-muted" aria-hidden="true" />
              <div>
                <p className="notification-panel__empty-title">No notifications yet</p>
                <p>New updates will appear here.</p>
              </div>
            </div>
          ) : (
            <ul className="notification-panel__list">
              {items.map((n) => (
                <li
                  key={n.id}
                  className={
                    n.readAt
                      ? 'notification-panel__item'
                      : 'notification-panel__item notification-panel__item--unread'
                  }
                >
                  <button
                    type="button"
                    className="notification-panel__item-button"
                    disabled={Boolean(n.readAt) && !n.linkPath}
                    onClick={() => openItem(n)}
                  >
                    <div className="notification-panel__item-heading">
                      <span
                        className={
                          n.readAt
                            ? 'notification-panel__read-marker'
                            : 'notification-panel__unread-marker'
                        }
                        aria-hidden="true"
                      />
                      <p className="notification-panel__item-title">{n.title}</p>
                    </div>
                    {n.body ? (
                      <p className="notification-panel__item-body">{n.body}</p>
                    ) : null}
                    <div className="notification-panel__item-meta">
                      <span className="notification-panel__item-action">
                        {n.linkPath ? 'View details' : n.readAt ? 'Read' : 'Mark as read'}
                      </span>
                      <span className="notification-panel__time">
                        {formatRelative(n.createdAt)}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="notification-panel__footer">
          <Link
            to="/notifications"
            className="notification-panel__all-link"
            onClick={() => setOpen(false)}
          >
            See all notifications →
          </Link>
        </div>
      </div>
    </Popover>
  );
}
