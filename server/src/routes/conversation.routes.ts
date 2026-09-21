import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import {
  listConversations,
  getConversation,
  createConversationService,
  updateConversationService,
  deleteConversationService,
  listMessages,
  createMessageService,
  deleteAllMessagesInConversation,
} from '../services/conversation.service';
import { findUserByIdAuth, getSessionByTokenHashAuth } from '../services/auth.service';
import type {} from '../repositories/types';

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

    const { limit, offset } = req.query as {
      limit?: string;
      offset?: string;
    };

    const limitNum = limit ? parseInt(limit, 10) : 50;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    const conversations = await listConversations(user.id, limitNum, offsetNum);
    res.json({ conversations });
  } catch (error) {
    console.error('List conversations error:', error);
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

    const { title, modelProvider, modelName, systemPrompt } = req.body as {
      title?: string | null;
      modelProvider?: string | null;
      modelName?: string | null;
      systemPrompt?: string | null;
    };

    const conversation = await createConversationService(
      user.id,
      title ?? null,
      modelProvider ?? null,
      modelName ?? null,
      systemPrompt ?? null,
    );

    res.status(201).json({ conversation });
  } catch (error) {
    console.error('Create conversation error:', error);
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
    const conversation = await getConversation(user.id, id);

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    res.json({ conversation });
  } catch (error) {
    console.error('Get conversation error:', error);
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
    const { title, modelProvider, modelName, systemPrompt } = req.body as {
      title?: string | null;
      modelProvider?: string | null;
      modelName?: string | null;
      systemPrompt?: string | null;
    };

    const conversation = await updateConversationService(user.id, id, {
      title,
      modelProvider,
      modelName,
      systemPrompt,
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    res.json({ conversation });
  } catch (error) {
    console.error('Update conversation error:', error);
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
    const success = await deleteConversationService(user.id, id);

    if (!success) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/messages', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const id = req.params.id as string;
    const { limit, offset } = req.query as {
      limit?: string;
      offset?: string;
    };

    const limitNum = limit ? parseInt(limit, 10) : 100;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    const messages = await listMessages(user.id, id, limitNum, offsetNum);
    res.json({ messages });
  } catch (error) {
    console.error('List messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/messages', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const id = req.params.id as string;
    const { role, content, toolCalls, toolCallId, metadata } = req.body as {
      role?: 'user' | 'assistant' | 'system' | 'tool';
      content?: string;
      toolCalls?: unknown | null;
      toolCallId?: string | null;
      metadata?: unknown | null;
    };

    if (!role || !content) {
      res.status(400).json({ error: 'role and content are required' });
      return;
    }

    const message = await createMessageService(
      user.id,
      id,
      role,
      content,
      toolCalls ?? null,
      toolCallId ?? null,
      metadata ?? null,
    );

    if (!message) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    res.status(201).json({ message });
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id/messages', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const id = req.params.id as string;
    const count = await deleteAllMessagesInConversation(user.id, id);

    if (count === 0) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    res.json({ message: `Deleted ${count} message(s)` });
  } catch (error) {
    console.error('Delete messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
