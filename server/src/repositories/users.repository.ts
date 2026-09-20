import { query } from '../database';
import { User } from './types';

export async function findUserById(id: string): Promise<User | null> {
  const result = await query<User>(
    `SELECT id, email, display_name as "displayName", created_at as "createdAt", updated_at as "updatedAt"
     FROM users WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await query<User>(
    `SELECT id, email, display_name as "displayName", created_at as "createdAt", updated_at as "updatedAt"
     FROM users WHERE email = $1`,
    [email],
  );
  return result.rows[0] ?? null;
}

export async function createUser(email: string, displayName: string): Promise<User> {
  const result = await query<User>(
    `INSERT INTO users (email, display_name) VALUES ($1, $2)
     RETURNING id, email, display_name as "displayName", created_at as "createdAt", updated_at as "updatedAt"`,
    [email, displayName],
  );
  return result.rows[0];
}

export async function updateUser(
  id: string,
  updates: Partial<Pick<User, 'email' | 'displayName'>>,
): Promise<User | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.email !== undefined) {
    fields.push(`email = $${paramIndex++}`);
    values.push(updates.email);
  }
  if (updates.displayName !== undefined) {
    fields.push(`display_name = $${paramIndex++}`);
    values.push(updates.displayName);
  }

  if (fields.length === 0) {
    return findUserById(id);
  }

  fields.push(`updated_at = now()`);
  values.push(id);

  const result = await query<User>(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}
     RETURNING id, email, display_name as "displayName", created_at as "createdAt", updated_at as "updatedAt"`,
    values,
  );
  return result.rows[0] ?? null;
}

export async function deleteUser(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM users WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}
