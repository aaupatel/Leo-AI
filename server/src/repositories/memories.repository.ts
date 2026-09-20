import { query } from '../database';
import { Memory } from './types';

export async function findMemoryById(id: string): Promise<Memory | null> {
  const result = await query<Memory>(
    `SELECT id, user_id as "userId", type, key, value, embedding,
            source_conversation_id as "sourceConversationId", confidence,
            created_at as "createdAt", updated_at as "updatedAt"
     FROM memories WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function findMemoryByUserAndKey(
  userId: string,
  type: Memory['type'],
  key: string,
): Promise<Memory | null> {
  const result = await query<Memory>(
    `SELECT id, user_id as "userId", type, key, value, embedding,
            source_conversation_id as "sourceConversationId", confidence,
            created_at as "createdAt", updated_at as "updatedAt"
     FROM memories WHERE user_id = $1 AND type = $2 AND key = $3`,
    [userId, type, key],
  );
  return result.rows[0] ?? null;
}

export async function findMemoriesByUserId(userId: string): Promise<Memory[]> {
  const result = await query<Memory>(
    `SELECT id, user_id as "userId", type, key, value, embedding,
            source_conversation_id as "sourceConversationId", confidence,
            created_at as "createdAt", updated_at as "updatedAt"
     FROM memories WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
  return result.rows;
}

export async function findMemoriesByUserAndType(
  userId: string,
  type: Memory['type'],
): Promise<Memory[]> {
  const result = await query<Memory>(
    `SELECT id, user_id as "userId", type, key, value, embedding,
            source_conversation_id as "sourceConversationId", confidence,
            created_at as "createdAt", updated_at as "updatedAt"
     FROM memories WHERE user_id = $1 AND type = $2 ORDER BY created_at DESC`,
    [userId, type],
  );
  return result.rows;
}

export async function listMemoriesByUserId(
  userId: string,
  limit: number = 50,
  offset: number = 0,
): Promise<Memory[]> {
  const result = await query<Memory>(
    `SELECT id, user_id as "userId", type, key, value, embedding,
            source_conversation_id as "sourceConversationId", confidence,
            created_at as "createdAt", updated_at as "updatedAt"
     FROM memories WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );
  return result.rows;
}

export async function createMemory(
  userId: string,
  type: 'fact' | 'preference' | 'context' | 'summary',
  key: string,
  value: string,
  sourceConversationId: string | null = null,
  confidence: number = 1.0,
  embedding: Buffer | null = null,
): Promise<Memory> {
  const result = await query<Memory>(
    `INSERT INTO memories (user_id, type, key, value, source_conversation_id, confidence, embedding)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, user_id as "userId", type, key, value, embedding,
               source_conversation_id as "sourceConversationId", confidence,
               created_at as "createdAt", updated_at as "updatedAt"`,
    [userId, type, key, value, sourceConversationId, confidence, embedding],
  );
  return result.rows[0];
}

export async function updateMemory(
  id: string,
  updates: Partial<
    Pick<Memory, 'type' | 'key' | 'value' | 'sourceConversationId' | 'confidence' | 'embedding'>
  >,
): Promise<Memory | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.type !== undefined) {
    fields.push(`type = $${paramIndex++}`);
    values.push(updates.type);
  }
  if (updates.key !== undefined) {
    fields.push(`key = $${paramIndex++}`);
    values.push(updates.key);
  }
  if (updates.value !== undefined) {
    fields.push(`value = $${paramIndex++}`);
    values.push(updates.value);
  }
  if (updates.sourceConversationId !== undefined) {
    fields.push(`source_conversation_id = $${paramIndex++}`);
    values.push(updates.sourceConversationId);
  }
  if (updates.confidence !== undefined) {
    fields.push(`confidence = $${paramIndex++}`);
    values.push(updates.confidence);
  }
  if (updates.embedding !== undefined) {
    fields.push(`embedding = $${paramIndex++}`);
    values.push(updates.embedding);
  }

  if (fields.length === 0) {
    return findMemoryById(id);
  }

  fields.push(`updated_at = now()`);
  values.push(id);

  const result = await query<Memory>(
    `UPDATE memories SET ${fields.join(', ')} WHERE id = $${paramIndex}
     RETURNING id, user_id as "userId", type, key, value, embedding,
               source_conversation_id as "sourceConversationId", confidence,
               created_at as "createdAt", updated_at as "updatedAt"`,
    values,
  );
  return result.rows[0] ?? null;
}

export async function deleteMemory(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM memories WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function deleteMemoriesByUserId(userId: string): Promise<number> {
  const result = await query(`DELETE FROM memories WHERE user_id = $1`, [userId]);
  return result.rowCount ?? 0;
}
