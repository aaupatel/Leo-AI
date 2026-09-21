import {
  findTaskByUserAndId,
  listTasksByUserId,
  createTask,
  updateTask,
  deleteTask,
  deleteTasksByUserId,
} from '../repositories/tasks.repository';
import {
  findReminderById,
  findRemindersByUserId,
  findRemindersByTaskId,
  createReminder,
  updateReminder,
  markReminderAsSent,
  deleteReminder,
  deleteRemindersByTaskId,
  deleteRemindersByUserId,
} from '../repositories/reminders.repository';
import type { Task, Reminder } from '../repositories/types';

export async function listTasks(
  userId: string,
  status?: Task['status'],
  limit: number = 50,
  offset: number = 0,
): Promise<Task[]> {
  return listTasksByUserId(userId, status, limit, offset);
}

export async function getTask(userId: string, id: string): Promise<Task | null> {
  return findTaskByUserAndId(userId, id);
}

export async function createTaskService(
  userId: string,
  title: string,
  description: string | null = null,
  status: Task['status'] = 'pending',
  priority: number = 0,
  dueAt: Date | null = null,
): Promise<Task> {
  return createTask(userId, title, description, status, priority, dueAt);
}

export async function updateTaskService(
  userId: string,
  id: string,
  updates: Partial<
    Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'dueAt' | 'completedAt'>
  >,
): Promise<Task | null> {
  const task = await findTaskByUserAndId(userId, id);
  if (!task) {
    return null;
  }
  return updateTask(id, updates);
}

export async function deleteTaskService(userId: string, id: string): Promise<boolean> {
  const task = await findTaskByUserAndId(userId, id);
  if (!task) {
    return false;
  }
  return deleteTask(id);
}

export async function deleteAllTasksByUserId(userId: string): Promise<number> {
  return deleteTasksByUserId(userId);
}

export async function listReminders(
  userId: string,
  limit: number = 100,
  offset: number = 0,
): Promise<Reminder[]> {
  const reminders = await findRemindersByUserId(userId);
  return reminders.slice(offset, offset + limit);
}

export async function getReminder(userId: string, id: string): Promise<Reminder | null> {
  const reminder = await findReminderById(id);
  if (!reminder || reminder.userId !== userId) {
    return null;
  }
  return reminder;
}

export async function listRemindersByTask(userId: string, taskId: string): Promise<Reminder[]> {
  const task = await findTaskByUserAndId(userId, taskId);
  if (!task) {
    return [];
  }
  return findRemindersByTaskId(taskId);
}

export async function createReminderService(
  userId: string,
  taskId: string,
  triggerAt: Date,
  deliveryMethod: 'push' | 'email' | 'in_app',
  payload: unknown | null = null,
): Promise<Reminder | null> {
  const task = await findTaskByUserAndId(userId, taskId);
  if (!task) {
    return null;
  }
  return createReminder(taskId, userId, triggerAt, deliveryMethod, payload);
}

export async function updateReminderService(
  userId: string,
  id: string,
  updates: Partial<Pick<Reminder, 'triggerAt' | 'deliveryMethod' | 'payload' | 'sentAt'>>,
): Promise<Reminder | null> {
  const reminder = await findReminderById(id);
  if (!reminder || reminder.userId !== userId) {
    return null;
  }
  return updateReminder(id, updates);
}

export async function markReminderAsSentService(
  userId: string,
  id: string,
  sentAt: Date = new Date(),
): Promise<Reminder | null> {
  const reminder = await findReminderById(id);
  if (!reminder || reminder.userId !== userId) {
    return null;
  }
  return markReminderAsSent(id, sentAt);
}

export async function deleteReminderService(userId: string, id: string): Promise<boolean> {
  const reminder = await findReminderById(id);
  if (!reminder || reminder.userId !== userId) {
    return false;
  }
  return deleteReminder(id);
}

export async function deleteAllRemindersByTask(userId: string, taskId: string): Promise<number> {
  const task = await findTaskByUserAndId(userId, taskId);
  if (!task) {
    return 0;
  }
  return deleteRemindersByTaskId(taskId);
}

export async function deleteAllRemindersByUserId(userId: string): Promise<number> {
  return deleteRemindersByUserId(userId);
}
