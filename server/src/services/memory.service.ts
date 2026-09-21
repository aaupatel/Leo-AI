import {
  findMemoryById,
  findMemoryByUserAndKey,
  findMemoriesByUserAndType,
  listMemoriesByUserId,
  createMemory,
  updateMemory,
  deleteMemory,
  deleteMemoriesByUserId,
} from '../repositories/memories.repository';
import type { Memory } from '../repositories/types';

export async function listMemories(
  userId: string,
  limit: number = 50,
  offset: number = 0,
): Promise<Memory[]> {
  return listMemoriesByUserId(userId, limit, offset);
}

export async function getMemory(userId: string, id: string): Promise<Memory | null> {
  const memory = await findMemoryById(id);
  if (!memory || memory.userId !== userId) {
    return null;
  }
  return memory;
}

export async function getMemoryByKey(
  userId: string,
  type: Memory['type'],
  key: string,
): Promise<Memory | null> {
  return findMemoryByUserAndKey(userId, type, key);
}

export async function listMemoriesByType(userId: string, type: Memory['type']): Promise<Memory[]> {
  return findMemoriesByUserAndType(userId, type);
}

export async function createMemoryService(
  userId: string,
  type: Memory['type'],
  key: string,
  value: string,
  sourceConversationId: string | null = null,
  confidence: number = 1.0,
  embedding: Buffer | null = null,
): Promise<Memory> {
  return createMemory(userId, type, key, value, sourceConversationId, confidence, embedding);
}

export async function updateMemoryService(
  userId: string,
  id: string,
  updates: Partial<
    Pick<Memory, 'type' | 'key' | 'value' | 'sourceConversationId' | 'confidence' | 'embedding'>
  >,
): Promise<Memory | null> {
  const memory = await findMemoryById(id);
  if (!memory || memory.userId !== userId) {
    return null;
  }
  return updateMemory(id, updates);
}

export async function deleteMemoryService(userId: string, id: string): Promise<boolean> {
  const memory = await findMemoryById(id);
  if (!memory || memory.userId !== userId) {
    return false;
  }
  return deleteMemory(id);
}

export async function deleteAllMemoriesByUserId(userId: string): Promise<number> {
  return deleteMemoriesByUserId(userId);
}
