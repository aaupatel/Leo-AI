import { query } from '../database';
import { Conversation } from './types';

export async function findConversationById(id: string): Promise<Conversation | null> {
  const result = await query<Conversation>(
    `SELECT id, user_id as "userId", title, model_provider as "modelProvider",
            model_name as "modelName", system_prompt as "systemPrompt",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM conversations WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function findConversationByUserAndId(
  userId: string,
  id: string,
): Promise<Conversation | null> {
  const result = await query<Conversation>(
    `SELECT id, user_id as "userId", title, model_provider as "modelProvider",
            model_name as "modelName", system_prompt as "systemPrompt",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM conversations WHERE user_id = $1 AND id = $2`,
    [userId, id],
  );
  return result.rows[0] ?? null;
}

export async function listConversationsByUserId(
  userId: string,
  limit: number = 50,
  offset: number = 0,
): Promise<Conversation[]> {
  const result = await query<Conversation>(
    `SELECT id, user_id as "userId", title, model_provider as "modelProvider",
            model_name as "modelName", system_prompt as "systemPrompt",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM conversations WHERE user_id = $1
     ORDER BY updated_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );
  return result.rows;
}

export async function createConversation(
  userId: string,
  title: string | null,
  modelProvider: string | null,
  modelName: string | null,
  systemPrompt: string | null,
): Promise<Conversation> {
  const result = await query<Conversation>(
    `INSERT INTO conversations (user_id, title, model_provider, model_name, system_prompt)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id as "userId", title, model_provider as "modelProvider",
               model_name as "modelName", system_prompt as "systemPrompt",
               created_at as "createdAt", updated_at as "updatedAt"`,
    [userId, title, modelProvider, modelName, systemPrompt],
  );
  return result.rows[0];
}

export async function updateConversation(
  id: string,
  updates: Partial<Pick<Conversation, 'title' | 'modelProvider' | 'modelName' | 'systemPrompt'>>,
): Promise<Conversation | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.title !== undefined) {
    fields.push(`title = $${paramIndex++}`);
    values.push(updates.title);
  }
  if (updates.modelProvider !== undefined) {
    fields.push(`model_provider = $${paramIndex++}`);
    values.push(updates.modelProvider);
  }
  if (updates.modelName !== undefined) {
    fields.push(`model_name = $${paramIndex++}`);
    values.push(updates.modelName);
  }
  if (updates.systemPrompt !== undefined) {
    fields.push(`system_prompt = $${paramIndex++}`);
    values.push(updates.systemPrompt);
  }

  if (fields.length === 0) {
    return findConversationById(id);
  }

  fields.push(`updated_at = now()`);
  values.push(id);

  const result = await query<Conversation>(
    `UPDATE conversations SET ${fields.join(', ')} WHERE id = $${paramIndex}
     RETURNING id, user_id as "userId", title, model_provider as "modelProvider",
               model_name as "modelName", system_prompt as "systemPrompt",
               created_at as "createdAt", updated_at as "updatedAt"`,
    values,
  );
  return result.rows[0] ?? null;
}

export async function deleteConversation(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM conversations WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function deleteConversationsByUserId(userId: string): Promise<number> {
  const result = await query(`DELETE FROM conversations WHERE user_id = $1`, [userId]);
  return result.rowCount ?? 0;
}
