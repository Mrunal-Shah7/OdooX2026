import { paginationMeta } from '../lib/pagination.js';

const stubNotification = {
  id: '11111111-1111-4111-8111-111111111111',
  type: 'time_off_requested' as const,
  title: 'Time off request pending',
  body: 'Priya Sharma requested 3 days of Annual Leave',
  linkPath: '/time-off/requests/44444444-4444-4444-8444-444444444444',
  readAt: null,
  createdAt: '2026-01-15T10:00:00.000Z',
};

export async function listNotifications(query: {
  page: number;
  pageSize: number;
  unreadOnly?: boolean;
}) {
  // TODO: STUB
  const meta = paginationMeta(query.page, query.pageSize, 1);
  return {
    data: [stubNotification],
    meta: { ...meta, unread: 1 },
  };
}

export async function markNotificationsRead(_body: { ids?: string[]; all?: boolean }) {
  // TODO: STUB
}
