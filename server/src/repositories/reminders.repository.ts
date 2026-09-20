import { query } from '../database';
import { Reminder } from './types';

export async function findReminderById(id: string): Promise<Reminder | null> {
  const result = await query<Reminder>(
    `SELECT id, task_id as "taskId", user_id as "userId", trigger_at as "triggerAt",
            delivery_method as "deliveryMethod", payload, sent_at as "sentAt",
            created_at as "createdAt"
     FROM reminders WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function findRemindersByUserId(userId: string): Promise<Reminder[]> {
  const result = await query<Reminder>(
    `SELECT id, task_id as "taskId", user_id as "userId", trigger_at as "triggerAt",
            delivery_method as "deliveryMethod", payload, sent_at as "sentAt",
            created_at as "createdAt"
     FROM reminders WHERE user_id = $1 ORDER BY trigger_at ASC`,
    [userId],
  );
  return result.rows;
}

export async function findRemindersByTaskId(taskId: string): Promise<Reminder[]> {
  const result = await query<Reminder>(
    `SELECT id, task_id as "taskId", user_id as "userId", trigger_at as "triggerAt",
            delivery_method as "deliveryMethod", payload, sent_at as "sentAt",
            created_at as "createdAt"
     FROM reminders WHERE task_id = $1 ORDER BY trigger_at ASC`,
    [taskId],
  );
  return result.rows;
}

export async function listPendingReminders(limit: number = 100): Promise<Reminder[]> {
  const result = await query<Reminder>(
    `SELECT id, task_id as "taskId", user_id as "userId", trigger_at as "triggerAt",
            delivery_method as "deliveryMethod", payload, sent_at as "sentAt",
            created_at as "createdAt"
     FROM reminders WHERE sent_at IS NULL AND trigger_at <= now()
     ORDER BY trigger_at ASC
     LIMIT $1`,
    [limit],
  );
  return result.rows;
}

export async function createReminder(
  taskId: string,
  userId: string,
  triggerAt: Date,
  deliveryMethod: 'push' | 'email' | 'in_app',
  payload: unknown | null = null,
): Promise<Reminder> {
  const result = await query<Reminder>(
    `INSERT INTO reminders (task_id, user_id, trigger_at, delivery_method, payload)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, task_id as "taskId", user_id as "userId", trigger_at as "triggerAt",
               delivery_method as "deliveryMethod", payload, sent_at as "sentAt",
               created_at as "createdAt"`,
    [taskId, userId, triggerAt, deliveryMethod, payload],
  );
  return result.rows[0];
}

export async function updateReminder(
  id: string,
  updates: Partial<Pick<Reminder, 'triggerAt' | 'deliveryMethod' | 'payload' | 'sentAt'>>,
): Promise<Reminder | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.triggerAt !== undefined) {
    fields.push(`trigger_at = $${paramIndex++}`);
    values.push(updates.triggerAt);
  }
  if (updates.deliveryMethod !== undefined) {
    fields.push(`delivery_method = $${paramIndex++}`);
    values.push(updates.deliveryMethod);
  }
  if (updates.payload !== undefined) {
    fields.push(`payload = $${paramIndex++}`);
    values.push(updates.payload);
  }
  if (updates.sentAt !== undefined) {
    fields.push(`sent_at = $${paramIndex++}`);
    values.push(updates.sentAt);
  }

  if (fields.length === 0) {
    return findReminderById(id);
  }

  values.push(id);

  const result = await query<Reminder>(
    `UPDATE reminders SET ${fields.join(', ')} WHERE id = $${paramIndex}
     RETURNING id, task_id as "taskId", user_id as "userId", trigger_at as "triggerAt",
               delivery_method as "deliveryMethod", payload, sent_at as "sentAt",
               created_at as "createdAt"`,
    values,
  );
  return result.rows[0] ?? null;
}

export async function markReminderAsSent(
  id: string,
  sentAt: Date = new Date(),
): Promise<Reminder | null> {
  return updateReminder(id, { sentAt });
}

export async function deleteReminder(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM reminders WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function deleteRemindersByTaskId(taskId: string): Promise<number> {
  const result = await query(`DELETE FROM reminders WHERE task_id = $1`, [taskId]);
  return result.rowCount ?? 0;
}

export async function deleteRemindersByUserId(userId: string): Promise<number> {
  const result = await query(`DELETE FROM reminders WHERE user_id = $1`, [userId]);
  return result.rowCount ?? 0;
}
