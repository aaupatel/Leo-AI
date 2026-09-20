import { query } from '../database';
import { Session, RefreshToken } from './types';

export async function findSessionById(id: string): Promise<Session | null> {
  const result = await query<Session>(
    `SELECT id, user_id as "userId", device_id as "deviceId", token_hash as "tokenHash",
            expires_at as "expiresAt", created_at as "createdAt"
     FROM sessions WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function findSessionsByUserId(userId: string): Promise<Session[]> {
  const result = await query<Session>(
    `SELECT id, user_id as "userId", device_id as "deviceId", token_hash as "tokenHash",
            expires_at as "expiresAt", created_at as "createdAt"
     FROM sessions WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
  return result.rows;
}

export async function findSessionByTokenHash(tokenHash: string): Promise<Session | null> {
  const result = await query<Session>(
    `SELECT id, user_id as "userId", device_id as "deviceId", token_hash as "tokenHash",
            expires_at as "expiresAt", created_at as "createdAt"
     FROM sessions WHERE token_hash = $1`,
    [tokenHash],
  );
  return result.rows[0] ?? null;
}

export async function createSession(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
  deviceId: string | null = null,
): Promise<Session> {
  const result = await query<Session>(
    `INSERT INTO sessions (user_id, device_id, token_hash, expires_at) VALUES ($1, $2, $3, $4)
     RETURNING id, user_id as "userId", device_id as "deviceId", token_hash as "tokenHash",
               expires_at as "expiresAt", created_at as "createdAt"`,
    [userId, deviceId, tokenHash, expiresAt],
  );
  return result.rows[0];
}

export async function updateSession(
  id: string,
  updates: Partial<Pick<Session, 'deviceId' | 'tokenHash' | 'expiresAt'>>,
): Promise<Session | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.deviceId !== undefined) {
    fields.push(`device_id = $${paramIndex++}`);
    values.push(updates.deviceId);
  }
  if (updates.tokenHash !== undefined) {
    fields.push(`token_hash = $${paramIndex++}`);
    values.push(updates.tokenHash);
  }
  if (updates.expiresAt !== undefined) {
    fields.push(`expires_at = $${paramIndex++}`);
    values.push(updates.expiresAt);
  }

  if (fields.length === 0) {
    return findSessionById(id);
  }

  values.push(id);

  const result = await query<Session>(
    `UPDATE sessions SET ${fields.join(', ')} WHERE id = $${paramIndex}
     RETURNING id, user_id as "userId", device_id as "deviceId", token_hash as "tokenHash",
               expires_at as "expiresAt", created_at as "createdAt"`,
    values,
  );
  return result.rows[0] ?? null;
}

export async function deleteSession(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM sessions WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function deleteSessionsByUserId(userId: string): Promise<number> {
  const result = await query(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
  return result.rowCount ?? 0;
}

export async function deleteExpiredSessions(): Promise<number> {
  const result = await query(`DELETE FROM sessions WHERE expires_at < now()`);
  return result.rowCount ?? 0;
}

export async function findRefreshTokenById(id: string): Promise<RefreshToken | null> {
  const result = await query<RefreshToken>(
    `SELECT id, session_id as "sessionId", token_hash as "tokenHash",
            expires_at as "expiresAt", created_at as "createdAt"
     FROM refresh_tokens WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function findRefreshTokenByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
  const result = await query<RefreshToken>(
    `SELECT id, session_id as "sessionId", token_hash as "tokenHash",
            expires_at as "expiresAt", created_at as "createdAt"
     FROM refresh_tokens WHERE token_hash = $1`,
    [tokenHash],
  );
  return result.rows[0] ?? null;
}

export async function findRefreshTokensBySessionId(sessionId: string): Promise<RefreshToken[]> {
  const result = await query<RefreshToken>(
    `SELECT id, session_id as "sessionId", token_hash as "tokenHash",
            expires_at as "expiresAt", created_at as "createdAt"
     FROM refresh_tokens WHERE session_id = $1 ORDER BY created_at DESC`,
    [sessionId],
  );
  return result.rows;
}

export async function createRefreshToken(
  sessionId: string,
  tokenHash: string,
  expiresAt: Date,
): Promise<RefreshToken> {
  const result = await query<RefreshToken>(
    `INSERT INTO refresh_tokens (session_id, token_hash, expires_at) VALUES ($1, $2, $3)
     RETURNING id, session_id as "sessionId", token_hash as "tokenHash",
               expires_at as "expiresAt", created_at as "createdAt"`,
    [sessionId, tokenHash, expiresAt],
  );
  return result.rows[0];
}

export async function deleteRefreshToken(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM refresh_tokens WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function deleteRefreshTokensBySessionId(sessionId: string): Promise<number> {
  const result = await query(`DELETE FROM refresh_tokens WHERE session_id = $1`, [sessionId]);
  return result.rowCount ?? 0;
}

export async function deleteExpiredRefreshTokens(): Promise<number> {
  const result = await query(`DELETE FROM refresh_tokens WHERE expires_at < now()`);
  return result.rowCount ?? 0;
}
