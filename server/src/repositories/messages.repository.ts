import { query } from '../database';
import { Message } from './types';

export async function findMessageById(id: string): Promise<Message | null> {
  const result = await query<Message>(
    `SELECT id, conversation_id as "conversationId", role, content,
            tool_calls as "toolCalls", tool_call_id as "toolCallId",
            metadata, created_at as "createdAt"
     FROM messages WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function findMessagesByConversationId(
  conversationId: string,
  limit: number = 100,
  offset: number = 0,
): Promise<Message[]> {
  const result = await query<Message>(
    `SELECT id, conversation_id as "conversationId", role, content,
            tool_calls as "toolCalls", tool_call_id as "toolCallId",
            metadata, created_at as "createdAt"
     FROM messages WHERE conversation_id = $1
     ORDER BY created_at ASC
     LIMIT $2 OFFSET $3`,
    [conversationId, limit, offset],
  );
  return result.rows;
}

export async function createMessage(
  conversationId: string,
  role: 'user' | 'assistant' | 'system' | 'tool',
  content: string,
  toolCalls: unknown | null = null,
  toolCallId: string | null = null,
  metadata: unknown | null = null,
): Promise<Message> {
  const result = await query<Message>(
    `INSERT INTO messages (conversation_id, role, content, tool_calls, tool_call_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, conversation_id as "conversationId", role, content,
               tool_calls as "toolCalls", tool_call_id as "toolCallId",
               metadata, created_at as "createdAt"`,
    [conversationId, role, content, toolCalls, toolCallId, metadata],
  );
  return result.rows[0];
}

export async function deleteMessagesByConversationId(conversationId: string): Promise<number> {
  const result = await query(`DELETE FROM messages WHERE conversation_id = $1`, [conversationId]);
  return result.rowCount ?? 0;
}
