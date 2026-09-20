import { query } from '../database';
import { Notification } from './types';

export async function findNotificationById(id: string): Promise<Notification | null> {
  const result = await query<Notification>(
    `SELECT id, user_id as "userId", type, title, body, data, priority,
            read_at as "readAt", delivered_at as "deliveredAt", created_at as "createdAt"
     FROM notifications WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function findNotificationByUserAndId(
  userId: string,
  id: string,
): Promise<Notification | null> {
  const result = await query<Notification>(
    `SELECT id, user_id as "userId", type, title, body, data, priority,
            read_at as "readAt", delivered_at as "deliveredAt", created_at as "createdAt"
     FROM notifications WHERE user_id = $1 AND id = $2`,
    [userId, id],
  );
  return result.rows[0] ?? null;
}

export async function listNotificationsByUserId(
  userId: string,
  options: { unreadOnly?: boolean; limit?: number; offset?: number } = {},
): Promise<Notification[]> {
  const { unreadOnly = false, limit = 50, offset = 0 } = options;

  const conditions: string[] = [`user_id = $1`];
  const values: unknown[] = [userId];

  if (unreadOnly) {
    conditions.push(`read_at IS NULL`);
  }

  const limitParam = values.length + 1;
  const offsetParam = values.length + 2;
  const sql = `
    SELECT id, user_id as "userId", type, title, body, data, priority,
           read_at as "readAt", delivered_at as "deliveredAt", created_at as "createdAt"
    FROM notifications WHERE ${conditions.join(' AND ')}
    ORDER BY created_at DESC LIMIT $${limitParam} OFFSET $${offsetParam}
  `;
  values.push(limit, offset);

  const result = await query<Notification>(sql, values);
  return result.rows;
}

export async function createNotification(
  userId: string,
  type: 'reminder' | 'automation' | 'system' | 'integration',
  title: string,
  body: string,
  data: unknown | null = null,
  priority: number = 0,
  deliveredAt: Date | null = null,
): Promise<Notification> {
  const result = await query<Notification>(
    `INSERT INTO notifications (user_id, type, title, body, data, priority, delivered_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, user_id as "userId", type, title, body, data, priority,
               read_at as "readAt", delivered_at as "deliveredAt", created_at as "createdAt"`,
    [userId, type, title, body, data, priority, deliveredAt],
  );
  return result.rows[0];
}

export async function markNotificationAsRead(
  id: string,
  readAt: Date = new Date(),
): Promise<Notification | null> {
  const result = await query<Notification>(
    `UPDATE notifications SET read_at = $1 WHERE id = $2
     RETURNING id, user_id as "userId", type, title, body, data, priority,
               read_at as "readAt", delivered_at as "deliveredAt", created_at as "createdAt"`,
    [readAt, id],
  );
  return result.rows[0] ?? null;
}

export async function markNotificationsAsRead(userId: string): Promise<number> {
  const result = await query(
    `UPDATE notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL`,
    [userId],
  );
  return result.rowCount ?? 0;
}

export async function markNotificationAsDelivered(
  id: string,
  deliveredAt: Date = new Date(),
): Promise<Notification | null> {
  const result = await query<Notification>(
    `UPDATE notifications SET delivered_at = $1 WHERE id = $2
     RETURNING id, user_id as "userId", type, title, body, data, priority,
               read_at as "readAt", delivered_at as "deliveredAt", created_at as "createdAt"`,
    [deliveredAt, id],
  );
  return result.rows[0] ?? null;
}

export async function deleteNotification(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM notifications WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function deleteNotificationsByUserId(userId: string): Promise<number> {
  const result = await query(`DELETE FROM notifications WHERE user_id = $1`, [userId]);
  return result.rowCount ?? 0;
}
