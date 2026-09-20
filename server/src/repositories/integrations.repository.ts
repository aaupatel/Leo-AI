import { query } from '../database';
import { Integration } from './types';

export async function findIntegrationById(id: string): Promise<Integration | null> {
  const result = await query<Integration>(
    `SELECT id, user_id as "userId", provider, display_name as "displayName",
            config, credentials_ref as "credentialsRef", status,
            last_sync_at as "lastSyncAt", created_at as "createdAt", updated_at as "updatedAt"
     FROM integrations WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function findIntegrationByUserAndProvider(
  userId: string,
  provider: string,
): Promise<Integration | null> {
  const result = await query<Integration>(
    `SELECT id, user_id as "userId", provider, display_name as "displayName",
            config, credentials_ref as "credentialsRef", status,
            last_sync_at as "lastSyncAt", created_at as "createdAt", updated_at as "updatedAt"
     FROM integrations WHERE user_id = $1 AND provider = $2`,
    [userId, provider],
  );
  return result.rows[0] ?? null;
}

export async function listIntegrationsByUserId(userId: string): Promise<Integration[]> {
  const result = await query<Integration>(
    `SELECT id, user_id as "userId", provider, display_name as "displayName",
            config, credentials_ref as "credentialsRef", status,
            last_sync_at as "lastSyncAt", created_at as "createdAt", updated_at as "updatedAt"
     FROM integrations WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
  return result.rows;
}

export async function createIntegration(
  userId: string,
  provider: string,
  displayName: string,
  config: unknown,
  credentialsRef: string | null = null,
  status: 'connected' | 'disconnected' | 'error' = 'disconnected',
  lastSyncAt: Date | null = null,
): Promise<Integration> {
  const result = await query<Integration>(
    `INSERT INTO integrations (user_id, provider, display_name, config, credentials_ref, status, last_sync_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, user_id as "userId", provider, display_name as "displayName",
               config, credentials_ref as "credentialsRef", status,
               last_sync_at as "lastSyncAt", created_at as "createdAt", updated_at as "updatedAt"`,
    [userId, provider, displayName, config, credentialsRef, status, lastSyncAt],
  );
  return result.rows[0];
}

export async function updateIntegration(
  id: string,
  updates: Partial<
    Pick<Integration, 'displayName' | 'config' | 'credentialsRef' | 'status' | 'lastSyncAt'>
  >,
): Promise<Integration | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.displayName !== undefined) {
    fields.push(`display_name = $${paramIndex++}`);
    values.push(updates.displayName);
  }
  if (updates.config !== undefined) {
    fields.push(`config = $${paramIndex++}`);
    values.push(updates.config);
  }
  if (updates.credentialsRef !== undefined) {
    fields.push(`credentials_ref = $${paramIndex++}`);
    values.push(updates.credentialsRef);
  }
  if (updates.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(updates.status);
  }
  if (updates.lastSyncAt !== undefined) {
    fields.push(`last_sync_at = $${paramIndex++}`);
    values.push(updates.lastSyncAt);
  }

  if (fields.length === 0) {
    return findIntegrationById(id);
  }

  fields.push(`updated_at = now()`);
  values.push(id);

  const result = await query<Integration>(
    `UPDATE integrations SET ${fields.join(', ')} WHERE id = $${paramIndex}
     RETURNING id, user_id as "userId", provider, display_name as "displayName",
               config, credentials_ref as "credentialsRef", status,
               last_sync_at as "lastSyncAt", created_at as "createdAt", updated_at as "updatedAt"`,
    values,
  );
  return result.rows[0] ?? null;
}

export async function deleteIntegration(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM integrations WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function deleteIntegrationsByUserId(userId: string): Promise<number> {
  const result = await query(`DELETE FROM integrations WHERE user_id = $1`, [userId]);
  return result.rowCount ?? 0;
}
