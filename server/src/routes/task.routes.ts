import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import {
  listTasks,
  getTask,
  createTaskService,
  updateTaskService,
  deleteTaskService,
  listReminders,
  getReminder,
  listRemindersByTask,
  createReminderService,
  updateReminderService,
  markReminderAsSentService,
  deleteReminderService,
} from '../services/task.service';
import { findUserByIdAuth, getSessionByTokenHashAuth } from '../services/auth.service';
import type { Task, Reminder } from '../repositories/types';

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

    const { status, limit, offset } = req.query as {
      status?: Task['status'];
      limit?: string;
      offset?: string;
    };

    const limitNum = limit ? parseInt(limit, 10) : 50;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    const tasks = await listTasks(user.id, status, limitNum, offsetNum);
    res.json({ tasks });
  } catch (error) {
    console.error('List tasks error:', error);
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

    const { title, description, status, priority, dueAt } = req.body as {
      title?: string;
      description?: string | null;
      status?: Task['status'];
      priority?: number;
      dueAt?: string | Date | null;
    };

    if (!title || typeof title !== 'string') {
      res.status(400).json({ error: 'title is required and must be a string' });
      return;
    }

    if (status && !['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      res.status(400).json({ error: 'Invalid status value' });
      return;
    }

    if (priority !== undefined && (typeof priority !== 'number' || !Number.isInteger(priority))) {
      res.status(400).json({ error: 'priority must be an integer' });
      return;
    }

    let parsedDueAt: Date | null = null;
    if (dueAt) {
      parsedDueAt = dueAt instanceof Date ? dueAt : new Date(dueAt);
      if (Number.isNaN(parsedDueAt.getTime())) {
        res.status(400).json({ error: 'dueAt must be a valid date' });
        return;
      }
    }

    const task = await createTaskService(
      user.id,
      title,
      description ?? null,
      status ?? 'pending',
      priority ?? 0,
      parsedDueAt,
    );

    res.status(201).json({ task });
  } catch (error) {
    console.error('Create task error:', error);
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
    const task = await getTask(user.id, id);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
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
    const { title, description, status, priority, dueAt, completedAt } = req.body as {
      title?: string;
      description?: string | null;
      status?: Task['status'];
      priority?: number;
      dueAt?: string | Date | null;
      completedAt?: string | Date | null;
    };

    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
      res.status(400).json({ error: 'title must be a non-empty string' });
      return;
    }

    if (status && !['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      res.status(400).json({ error: 'Invalid status value' });
      return;
    }

    if (priority !== undefined && (typeof priority !== 'number' || !Number.isInteger(priority))) {
      res.status(400).json({ error: 'priority must be an integer' });
      return;
    }

    let parsedDueAt: Date | null | undefined = undefined;
    if (dueAt !== undefined) {
      parsedDueAt = dueAt === null ? null : dueAt instanceof Date ? dueAt : new Date(dueAt);
      if (parsedDueAt !== null && Number.isNaN(parsedDueAt.getTime())) {
        res.status(400).json({ error: 'dueAt must be a valid date' });
        return;
      }
    }

    let parsedCompletedAt: Date | null | undefined = undefined;
    if (completedAt !== undefined) {
      parsedCompletedAt =
        completedAt === null
          ? null
          : completedAt instanceof Date
            ? completedAt
            : new Date(completedAt);
      if (parsedCompletedAt !== null && Number.isNaN(parsedCompletedAt.getTime())) {
        res.status(400).json({ error: 'completedAt must be a valid date' });
        return;
      }
    }

    const updates: Partial<
      Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'dueAt' | 'completedAt'>
    > = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (parsedDueAt !== undefined) updates.dueAt = parsedDueAt;
    if (parsedCompletedAt !== undefined) updates.completedAt = parsedCompletedAt;

    const task = await updateTaskService(user.id, id, updates);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json({ task });
  } catch (error) {
    console.error('Update task error:', error);
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
    const success = await deleteTaskService(user.id, id);

    if (!success) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:taskId/reminders', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const taskId = req.params.taskId as string;
    const { limit, offset } = req.query as {
      limit?: string;
      offset?: string;
    };

    const limitNum = limit ? parseInt(limit, 10) : 100;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    const reminders = await listRemindersByTask(user.id, taskId);
    const paginated = reminders.slice(offsetNum, offsetNum + limitNum);
    res.json({ reminders: paginated });
  } catch (error) {
    console.error('List reminders by task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:taskId/reminders', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const taskId = req.params.taskId as string;
    const { triggerAt, deliveryMethod, payload } = req.body as {
      triggerAt?: string | Date;
      deliveryMethod?: 'push' | 'email' | 'in_app';
      payload?: unknown | null;
    };

    if (!triggerAt) {
      res.status(400).json({ error: 'triggerAt is required' });
      return;
    }

    const parsedTriggerAt = triggerAt instanceof Date ? triggerAt : new Date(triggerAt);
    if (Number.isNaN(parsedTriggerAt.getTime())) {
      res.status(400).json({ error: 'triggerAt must be a valid date' });
      return;
    }

    if (!deliveryMethod || !['push', 'email', 'in_app'].includes(deliveryMethod)) {
      res.status(400).json({ error: 'deliveryMethod must be one of: push, email, in_app' });
      return;
    }

    const reminder = await createReminderService(
      user.id,
      taskId,
      parsedTriggerAt,
      deliveryMethod,
      payload ?? null,
    );

    if (!reminder) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.status(201).json({ reminder });
  } catch (error) {
    console.error('Create reminder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/reminders', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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

    const limitNum = limit ? parseInt(limit, 10) : 100;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    const reminders = await listReminders(user.id, limitNum, offsetNum);
    res.json({ reminders });
  } catch (error) {
    console.error('List reminders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/reminders/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const id = req.params.id as string;
    const reminder = await getReminder(user.id, id);

    if (!reminder) {
      res.status(404).json({ error: 'Reminder not found' });
      return;
    }

    res.json({ reminder });
  } catch (error) {
    console.error('Get reminder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/reminders/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const id = req.params.id as string;
    const { triggerAt, deliveryMethod, payload, sentAt } = req.body as {
      triggerAt?: string | Date | null;
      deliveryMethod?: 'push' | 'email' | 'in_app';
      payload?: unknown | null;
      sentAt?: string | Date | null;
    };

    if (triggerAt !== undefined) {
      const parsed =
        triggerAt === null ? null : triggerAt instanceof Date ? triggerAt : new Date(triggerAt);
      if (parsed !== null && Number.isNaN(parsed.getTime())) {
        res.status(400).json({ error: 'triggerAt must be a valid date' });
        return;
      }
    }

    if (deliveryMethod !== undefined && !['push', 'email', 'in_app'].includes(deliveryMethod)) {
      res.status(400).json({ error: 'deliveryMethod must be one of: push, email, in_app' });
      return;
    }

    if (sentAt !== undefined) {
      const parsed = sentAt === null ? null : sentAt instanceof Date ? sentAt : new Date(sentAt);
      if (parsed !== null && Number.isNaN(parsed.getTime())) {
        res.status(400).json({ error: 'sentAt must be a valid date' });
        return;
      }
    }

    const updates: {
      triggerAt?: Date | null;
      deliveryMethod?: Reminder['deliveryMethod'];
      payload?: unknown | null;
      sentAt?: Date | null;
    } = {};
    if (triggerAt !== undefined)
      updates.triggerAt =
        triggerAt === null ? null : triggerAt instanceof Date ? triggerAt : new Date(triggerAt);
    if (deliveryMethod !== undefined) updates.deliveryMethod = deliveryMethod;
    if (payload !== undefined) updates.payload = payload;
    if (sentAt !== undefined)
      updates.sentAt = sentAt === null ? null : sentAt instanceof Date ? sentAt : new Date(sentAt);

    const reminder = await updateReminderService(
      user.id,
      id,
      updates as Partial<Pick<Reminder, 'triggerAt' | 'deliveryMethod' | 'payload' | 'sentAt'>>,
    );

    if (!reminder) {
      res.status(404).json({ error: 'Reminder not found' });
      return;
    }

    res.json({ reminder });
  } catch (error) {
    console.error('Update reminder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/reminders/:id/sent', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const id = req.params.id as string;
    const { sentAt } = req.body as { sentAt?: string | Date };

    const parsedSentAt = sentAt ? (sentAt instanceof Date ? sentAt : new Date(sentAt)) : new Date();
    if (Number.isNaN(parsedSentAt.getTime())) {
      res.status(400).json({ error: 'sentAt must be a valid date' });
      return;
    }

    const reminder = await markReminderAsSentService(user.id, id, parsedSentAt);

    if (!reminder) {
      res.status(404).json({ error: 'Reminder not found' });
      return;
    }

    res.json({ reminder });
  } catch (error) {
    console.error('Mark reminder sent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/reminders/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const id = req.params.id as string;
    const success = await deleteReminderService(user.id, id);

    if (!success) {
      res.status(404).json({ error: 'Reminder not found' });
      return;
    }

    res.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
