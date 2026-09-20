import { query } from '../database';
import { Device } from './types';

export async function findDeviceById(id: string): Promise<Device | null> {
  const result = await query<Device>(
    `SELECT id, user_id as "userId", name, platform, device_token as "deviceToken",
            last_seen_at as "lastSeenAt", created_at as "createdAt", updated_at as "updatedAt"
     FROM devices WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function findDevicesByUserId(userId: string): Promise<Device[]> {
  const result = await query<Device>(
    `SELECT id, user_id as "userId", name, platform, device_token as "deviceToken",
            last_seen_at as "lastSeenAt", created_at as "createdAt", updated_at as "updatedAt"
     FROM devices WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
  return result.rows;
}

export async function findDeviceByToken(deviceToken: string): Promise<Device | null> {
  const result = await query<Device>(
    `SELECT id, user_id as "userId", name, platform, device_token as "deviceToken",
            last_seen_at as "lastSeenAt", created_at as "createdAt", updated_at as "updatedAt"
     FROM devices WHERE device_token = $1`,
    [deviceToken],
  );
  return result.rows[0] ?? null;
}

export async function createDevice(
  userId: string,
  name: string,
  platform: 'windows' | 'android' | 'web',
  deviceToken: string | null = null,
): Promise<Device> {
  const result = await query<Device>(
    `INSERT INTO devices (user_id, name, platform, device_token) VALUES ($1, $2, $3, $4)
     RETURNING id, user_id as "userId", name, platform, device_token as "deviceToken",
               last_seen_at as "lastSeenAt", created_at as "createdAt", updated_at as "updatedAt"`,
    [userId, name, platform, deviceToken],
  );
  return result.rows[0];
}

export async function updateDevice(
  id: string,
  updates: Partial<Pick<Device, 'name' | 'platform' | 'deviceToken' | 'lastSeenAt'>>,
): Promise<Device | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.platform !== undefined) {
    fields.push(`platform = $${paramIndex++}`);
    values.push(updates.platform);
  }
  if (updates.deviceToken !== undefined) {
    fields.push(`device_token = $${paramIndex++}`);
    values.push(updates.deviceToken);
  }
  if (updates.lastSeenAt !== undefined) {
    fields.push(`last_seen_at = $${paramIndex++}`);
    values.push(updates.lastSeenAt);
  }

  if (fields.length === 0) {
    return findDeviceById(id);
  }

  fields.push(`updated_at = now()`);
  values.push(id);

  const result = await query<Device>(
    `UPDATE devices SET ${fields.join(', ')} WHERE id = $${paramIndex}
     RETURNING id, user_id as "userId", name, platform, device_token as "deviceToken",
               last_seen_at as "lastSeenAt", created_at as "createdAt", updated_at as "updatedAt"`,
    values,
  );
  return result.rows[0] ?? null;
}

export async function deleteDevice(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM devices WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function deleteDevicesByUserId(userId: string): Promise<number> {
  const result = await query(`DELETE FROM devices WHERE user_id = $1`, [userId]);
  return result.rowCount ?? 0;
}
