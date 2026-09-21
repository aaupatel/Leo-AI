import {
  findConversationByUserAndId,
  listConversationsByUserId,
  createConversation,
  updateConversation,
  deleteConversation,
  deleteConversationsByUserId,
} from '../repositories/conversations.repository';
import {
  findMessagesByConversationId,
  createMessage,
  deleteMessagesByConversationId,
} from '../repositories/messages.repository';
import type { Conversation, Message } from '../repositories/types';

export async function listConversations(
  userId: string,
  limit: number = 50,
  offset: number = 0,
): Promise<Conversation[]> {
  return listConversationsByUserId(userId, limit, offset);
}

export async function getConversation(userId: string, id: string): Promise<Conversation | null> {
  return findConversationByUserAndId(userId, id);
}

export async function createConversationService(
  userId: string,
  title: string | null = null,
  modelProvider: string | null = null,
  modelName: string | null = null,
  systemPrompt: string | null = null,
): Promise<Conversation> {
  return createConversation(userId, title, modelProvider, modelName, systemPrompt);
}

export async function updateConversationService(
  userId: string,
  id: string,
  updates: Partial<Pick<Conversation, 'title' | 'modelProvider' | 'modelName' | 'systemPrompt'>>,
): Promise<Conversation | null> {
  const conversation = await findConversationByUserAndId(userId, id);
  if (!conversation) {
    return null;
  }
  return updateConversation(id, updates);
}

export async function deleteConversationService(userId: string, id: string): Promise<boolean> {
  const conversation = await findConversationByUserAndId(userId, id);
  if (!conversation) {
    return false;
  }
  return deleteConversation(id);
}

export async function deleteAllConversationsByUserId(userId: string): Promise<number> {
  return deleteConversationsByUserId(userId);
}

export async function listMessages(
  userId: string,
  conversationId: string,
  limit: number = 100,
  offset: number = 0,
): Promise<Message[]> {
  const conversation = await findConversationByUserAndId(userId, conversationId);
  if (!conversation) {
    return [];
  }
  return findMessagesByConversationId(conversationId, limit, offset);
}

export async function createMessageService(
  userId: string,
  conversationId: string,
  role: 'user' | 'assistant' | 'system' | 'tool',
  content: string,
  toolCalls: unknown | null = null,
  toolCallId: string | null = null,
  metadata: unknown | null = null,
): Promise<Message | null> {
  const conversation = await findConversationByUserAndId(userId, conversationId);
  if (!conversation) {
    return null;
  }
  return createMessage(conversationId, role, content, toolCalls, toolCallId, metadata);
}

export async function deleteAllMessagesInConversation(
  userId: string,
  conversationId: string,
): Promise<number> {
  const conversation = await findConversationByUserAndId(userId, conversationId);
  if (!conversation) {
    return 0;
  }
  return deleteMessagesByConversationId(conversationId);
}
