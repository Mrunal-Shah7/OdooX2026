import { prisma } from '../db/client.js';
import { paginationMeta } from '../lib/pagination.js';
import type { NotificationType } from '../../../shared/constants.js';

export async function create(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkPath?: string | null;
}): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      linkPath: input.linkPath ?? null,
    },
  });
}

export async function listNotifications(
  userId: string,
  query: { page: number; pageSize: number; unreadOnly?: boolean },
) {
  const where = {
    userId,
    ...(query.unreadOnly ? { readAt: null } : {}),
  };

  const [total, unread, rows] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, readAt: null } }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  const meta = paginationMeta(query.page, query.pageSize, total);

  return {
    data: rows.map((n) => ({
      id: n.id,
      type: n.type as NotificationType,
      title: n.title,
      body: n.body,
      linkPath: n.linkPath,
      readAt: n.readAt ? n.readAt.toISOString() : null,
      createdAt: n.createdAt.toISOString(),
    })),
    meta: { ...meta, unread },
  };
}

export async function markNotificationsRead(
  userId: string,
  body: { ids?: string[]; all?: boolean },
): Promise<void> {
  const now = new Date();

  if (body.all) {
    await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: now },
    });
    return;
  }

  if (body.ids && body.ids.length > 0) {
    await prisma.notification.updateMany({
      where: { userId, id: { in: body.ids }, readAt: null },
      data: { readAt: now },
    });
  }
}
