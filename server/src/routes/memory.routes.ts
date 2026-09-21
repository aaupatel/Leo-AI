import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import {
  listMemories,
  getMemory,
  getMemoryByKey,
  listMemoriesByType,
  createMemoryService,
  updateMemoryService,
  deleteMemoryService,
} from '../services/memory.service';
import { findUserByIdAuth, getSessionByTokenHashAuth } from '../services/auth.service';
import type { Memory } from '../repositories/types';

const router = Router();

interface AuthenticatedRequest extends Request {
  user?: { id: string };
  sessionId?: string;
}

async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }
  const token = authHeader.substring(7);
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const session = await getSessionByTokenHashAuth(tokenHash);
  if (!session) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  if (session.expiresAt < new Date()) {
    res.status(401).json({ error: 'Token expired' });
    return;
  }

  const user = await findUserByIdAuth(session.userId);
  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }

  req.user = { id: user.id };
  req.sessionId = session.id;
  next();
}

router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { type, limit, offset } = req.query as {
      type?: Memory['type'];
      limit?: string;
      offset?: string;
    };

    const limitNum = limit ? parseInt(limit, 10) : 50;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    let memories: Memory[];
    if (type && ['fact', 'preference', 'context', 'summary'].includes(type)) {
      memories = await listMemoriesByType(user.id, type);
      memories = memories.slice(offsetNum, offsetNum + limitNum);
    } else {
      memories = await listMemories(user.id, limitNum, offsetNum);
    }

    res.json({ memories });
  } catch (error) {
    console.error('List memories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { type, key, value, sourceConversationId, confidence, embedding } = req.body as {
      type?: Memory['type'];
      key?: string;
      value?: string;
      sourceConversationId?: string | null;
      confidence?: number;
      embedding?: Buffer | null;
    };

    if (!type || !['fact', 'preference', 'context', 'summary'].includes(type)) {
      res.status(400).json({ error: 'type must be one of: fact, preference, context, summary' });
      return;
    }

    if (!key || typeof key !== 'string') {
      res.status(400).json({ error: 'key is required and must be a string' });
      return;
    }

    if (!value || typeof value !== 'string') {
      res.status(400).json({ error: 'value is required and must be a string' });
      return;
    }

    if (
      sourceConversationId !== undefined &&
      sourceConversationId !== null &&
      typeof sourceConversationId !== 'string'
    ) {
      res.status(400).json({ error: 'sourceConversationId must be a string or null' });
      return;
    }

    if (
      confidence !== undefined &&
      (typeof confidence !== 'number' || confidence < 0 || confidence > 1)
    ) {
      res.status(400).json({ error: 'confidence must be a number between 0 and 1' });
      return;
    }

    const memory = await createMemoryService(
      user.id,
      type,
      key,
      value,
      sourceConversationId ?? null,
      confidence ?? 1.0,
      embedding ?? null,
    );

    res.status(201).json({ memory });
  } catch (error) {
    console.error('Create memory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/by-key', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { type, key } = req.query as {
      type?: Memory['type'];
      key?: string;
    };

    if (!type || !['fact', 'preference', 'context', 'summary'].includes(type)) {
      res.status(400).json({ error: 'type must be one of: fact, preference, context, summary' });
      return;
    }

    if (!key || typeof key !== 'string') {
      res.status(400).json({ error: 'key is required and must be a string' });
      return;
    }

    const memory = await getMemoryByKey(user.id, type, key);

    if (!memory) {
      res.status(404).json({ error: 'Memory not found' });
      return;
    }

    res.json({ memory });
  } catch (error) {
    console.error('Get memory by key error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const id = req.params.id as string;
    const memory = await getMemory(user.id, id);

    if (!memory) {
      res.status(404).json({ error: 'Memory not found' });
      return;
    }

    res.json({ memory });
  } catch (error) {
    console.error('Get memory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const id = req.params.id as string;
    const { type, key, value, sourceConversationId, confidence, embedding } = req.body as {
      type?: Memory['type'];
      key?: string;
      value?: string;
      sourceConversationId?: string | null;
      confidence?: number;
      embedding?: Buffer | null;
    };

    if (type !== undefined && !['fact', 'preference', 'context', 'summary'].includes(type)) {
      res.status(400).json({ error: 'type must be one of: fact, preference, context, summary' });
      return;
    }

    if (key !== undefined && (typeof key !== 'string' || key.trim() === '')) {
      res.status(400).json({ error: 'key must be a non-empty string' });
      return;
    }

    if (value !== undefined && typeof value !== 'string') {
      res.status(400).json({ error: 'value must be a string' });
      return;
    }

    if (
      sourceConversationId !== undefined &&
      sourceConversationId !== null &&
      typeof sourceConversationId !== 'string'
    ) {
      res.status(400).json({ error: 'sourceConversationId must be a string or null' });
      return;
    }

    if (
      confidence !== undefined &&
      (typeof confidence !== 'number' || confidence < 0 || confidence > 1)
    ) {
      res.status(400).json({ error: 'confidence must be a number between 0 and 1' });
      return;
    }

    const updates: Partial<
      Pick<Memory, 'type' | 'key' | 'value' | 'sourceConversationId' | 'confidence' | 'embedding'>
    > = {};
    if (type !== undefined) updates.type = type;
    if (key !== undefined) updates.key = key;
    if (value !== undefined) updates.value = value;
    if (sourceConversationId !== undefined) updates.sourceConversationId = sourceConversationId;
    if (confidence !== undefined) updates.confidence = confidence;
    if (embedding !== undefined) updates.embedding = embedding;

    const memory = await updateMemoryService(user.id, id, updates);

    if (!memory) {
      res.status(404).json({ error: 'Memory not found' });
      return;
    }

    res.json({ memory });
  } catch (error) {
    console.error('Update memory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const id = req.params.id as string;
    const success = await deleteMemoryService(user.id, id);

    if (!success) {
      res.status(404).json({ error: 'Memory not found' });
      return;
    }

    res.json({ message: 'Memory deleted successfully' });
  } catch (error) {
    console.error('Delete memory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
