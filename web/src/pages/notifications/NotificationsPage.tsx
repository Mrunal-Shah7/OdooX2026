import { useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DataTable, type ColumnMeta } from '../../components/ui/DataTable';
import { ErrorState } from '../../components/ui/ErrorState';
import { apiFetch } from '../../lib/apiFetch';
import { queryKeys } from '../../lib/queryKeys';
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

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: queryKeys.notifications.all({ page: 1, pageSize: 50 }),
    queryFn: () =>
      apiFetch<NotificationListResponse>('/notifications?page=1&pageSize=50'),
  });

  const markAll = useMutation({
    mutationFn: () =>
      apiFetch('/notifications/read', {
        method: 'POST',
        body: JSON.stringify({ all: true }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markOne = useMutation({
    mutationFn: (id: string) =>
      apiFetch('/notifications/read', {
        method: 'POST',
        body: JSON.stringify({ ids: [id] }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unread = data?.meta.unread ?? 0;
  const rows = data?.data ?? [];

  const columns: ColumnDef<NotificationItem, unknown>[] = [
    {
      accessorKey: 'createdAt',
      header: 'When',
      meta: { code: true } satisfies ColumnMeta,
      cell: ({ row }) => formatWhen(row.original.createdAt),
    },
    {
      id: 'notification',
      header: 'Notification',
      cell: ({ row }) => {
        const n = row.original;
        return (
          <button
            type="button"
            className="m-0 cursor-pointer border-0 bg-transparent p-0 text-left text-inherit hover:text-accent"
            onClick={() => {
              if (!n.readAt) markOne.mutate(n.id);
              if (n.linkPath) {
                void navigate({ to: n.linkPath });
              }
            }}
          >
            <strong>{n.title}</strong>
            {n.body ? ` — ${n.body}` : ''}
          </button>
        );
      },
    },
    {
      id: 'status',
      header: '',
      cell: ({ row }) =>
        row.original.readAt ? (
          <Badge variant="neutral">read</Badge>
        ) : (
          <Badge variant="info">unread</Badge>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle={unread === 1 ? '1 unread' : `${unread} unread`}
        actions={
          <Button
            variant="secondary"
            disabled={unread === 0 || markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            Mark all read
          </Button>
        }
      />
      <div className="px-4 pb-6 sm:px-5">
        {isError ? (
          <ErrorState message="Could not load notifications." onRetry={() => void refetch()} />
        ) : (
          <Card>
            <DataTable
              columns={columns}
              data={rows}
              isLoading={isLoading || isFetching}
              emptyMessage="No notifications yet."
              enablePagination={false}
            />
          </Card>
        )}
      </div>
    </>
  );
}
