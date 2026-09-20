import { query } from '../database';
import { Task } from './types';

export async function findTaskById(id: string): Promise<Task | null> {
  const result = await query<Task>(
    `SELECT id, user_id as "userId", title, description, status, priority,
            due_at as "dueAt", completed_at as "completedAt",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM tasks WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function findTaskByUserAndId(userId: string, id: string): Promise<Task | null> {
  const result = await query<Task>(
    `SELECT id, user_id as "userId", title, description, status, priority,
            due_at as "dueAt", completed_at as "completedAt",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM tasks WHERE user_id = $1 AND id = $2`,
    [userId, id],
  );
  return result.rows[0] ?? null;
}

export async function listTasksByUserId(
  userId: string,
  status?: Task['status'],
  limit: number = 50,
  offset: number = 0,
): Promise<Task[]> {
  const conditions: string[] = [`user_id = $1`];
  const values: unknown[] = [userId];

  if (status !== undefined) {
    conditions.push(`status = $${values.length + 1}`);
    values.push(status);
  }

  const limitParam = values.length + 1;
  const offsetParam = values.length + 2;
  const sql = `
    SELECT id, user_id as "userId", title, description, status, priority,
           due_at as "dueAt", completed_at as "completedAt",
           created_at as "createdAt", updated_at as "updatedAt"
    FROM tasks WHERE ${conditions.join(' AND ')}
    ORDER BY created_at DESC LIMIT $${limitParam} OFFSET $${offsetParam}
  `;
  values.push(limit, offset);

  const result = await query<Task>(sql, values);
  return result.rows;
}

export async function createTask(
  userId: string,
  title: string,
  description: string | null = null,
  status: Task['status'] = 'pending',
  priority: number = 0,
  dueAt: Date | null = null,
): Promise<Task> {
  const result = await query<Task>(
    `INSERT INTO tasks (user_id, title, description, status, priority, due_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, user_id as "userId", title, description, status, priority,
               due_at as "dueAt", completed_at as "completedAt",
               created_at as "createdAt", updated_at as "updatedAt"`,
    [userId, title, description, status, priority, dueAt],
  );
  return result.rows[0];
}

export async function updateTask(
  id: string,
  updates: Partial<
    Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'dueAt' | 'completedAt'>
  >,
): Promise<Task | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.title !== undefined) {
    fields.push(`title = $${paramIndex++}`);
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(updates.description);
  }
  if (updates.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(updates.status);
  }
  if (updates.priority !== undefined) {
    fields.push(`priority = $${paramIndex++}`);
    values.push(updates.priority);
  }
  if (updates.dueAt !== undefined) {
    fields.push(`due_at = $${paramIndex++}`);
    values.push(updates.dueAt);
  }
  if (updates.completedAt !== undefined) {
    fields.push(`completed_at = $${paramIndex++}`);
    values.push(updates.completedAt);
  }

  if (fields.length === 0) {
    return findTaskById(id);
  }

  fields.push(`updated_at = now()`);
  values.push(id);

  const result = await query<Task>(
    `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${paramIndex}
     RETURNING id, user_id as "userId", title, description, status, priority,
               due_at as "dueAt", completed_at as "completedAt",
               created_at as "createdAt", updated_at as "updatedAt"`,
    values,
  );
  return result.rows[0] ?? null;
}

export async function deleteTask(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM tasks WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function deleteTasksByUserId(userId: string): Promise<number> {
  const result = await query(`DELETE FROM tasks WHERE user_id = $1`, [userId]);
  return result.rowCount ?? 0;
}
