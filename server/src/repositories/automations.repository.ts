import { query } from '../database';
import { Automation } from './types';

export async function findAutomationById(id: string): Promise<Automation | null> {
  const result = await query<Automation>(
    `SELECT id, user_id as "userId", name, description,
            trigger_config as "triggerConfig", action_config as "actionConfig",
            conditions, enabled, last_run_at as "lastRunAt", next_run_at as "nextRunAt",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM automations WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function findAutomationByUserAndId(
  userId: string,
  id: string,
): Promise<Automation | null> {
  const result = await query<Automation>(
    `SELECT id, user_id as "userId", name, description,
            trigger_config as "triggerConfig", action_config as "actionConfig",
            conditions, enabled, last_run_at as "lastRunAt", next_run_at as "nextRunAt",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM automations WHERE user_id = $1 AND id = $2`,
    [userId, id],
  );
  return result.rows[0] ?? null;
}

export async function listAutomationsByUserId(userId: string): Promise<Automation[]> {
  const result = await query<Automation>(
    `SELECT id, user_id as "userId", name, description,
            trigger_config as "triggerConfig", action_config as "actionConfig",
            conditions, enabled, last_run_at as "lastRunAt", next_run_at as "nextRunAt",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM automations WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
  return result.rows;
}

export async function listEnabledAutomations(): Promise<Automation[]> {
  const result = await query<Automation>(
    `SELECT id, user_id as "userId", name, description,
            trigger_config as "triggerConfig", action_config as "actionConfig",
            conditions, enabled, last_run_at as "lastRunAt", next_run_at as "nextRunAt",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM automations WHERE enabled = true ORDER BY next_run_at ASC NULLS LAST`,
  );
  return result.rows;
}

export async function createAutomation(
  userId: string,
  name: string,
  triggerConfig: unknown,
  actionConfig: unknown,
  description: string | null = null,
  conditions: unknown | null = null,
  enabled: boolean = true,
  nextRunAt: Date | null = null,
): Promise<Automation> {
  const result = await query<Automation>(
    `INSERT INTO automations (user_id, name, description, trigger_config, action_config, conditions, enabled, next_run_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, user_id as "userId", name, description,
               trigger_config as "triggerConfig", action_config as "actionConfig",
               conditions, enabled, last_run_at as "lastRunAt", next_run_at as "nextRunAt",
               created_at as "createdAt", updated_at as "updatedAt"`,
    [userId, name, description, triggerConfig, actionConfig, conditions, enabled, nextRunAt],
  );
  return result.rows[0];
}

export async function updateAutomation(
  id: string,
  updates: Partial<
    Pick<
      Automation,
      | 'name'
      | 'description'
      | 'triggerConfig'
      | 'actionConfig'
      | 'conditions'
      | 'enabled'
      | 'lastRunAt'
      | 'nextRunAt'
    >
  >,
): Promise<Automation | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(updates.description);
  }
  if (updates.triggerConfig !== undefined) {
    fields.push(`trigger_config = $${paramIndex++}`);
    values.push(updates.triggerConfig);
  }
  if (updates.actionConfig !== undefined) {
    fields.push(`action_config = $${paramIndex++}`);
    values.push(updates.actionConfig);
  }
  if (updates.conditions !== undefined) {
    fields.push(`conditions = $${paramIndex++}`);
    values.push(updates.conditions);
  }
  if (updates.enabled !== undefined) {
    fields.push(`enabled = $${paramIndex++}`);
    values.push(updates.enabled);
  }
  if (updates.lastRunAt !== undefined) {
    fields.push(`last_run_at = $${paramIndex++}`);
    values.push(updates.lastRunAt);
  }
  if (updates.nextRunAt !== undefined) {
    fields.push(`next_run_at = $${paramIndex++}`);
    values.push(updates.nextRunAt);
  }

  if (fields.length === 0) {
    return findAutomationById(id);
  }

  fields.push(`updated_at = now()`);
  values.push(id);

  const result = await query<Automation>(
    `UPDATE automations SET ${fields.join(', ')} WHERE id = $${paramIndex}
     RETURNING id, user_id as "userId", name, description,
               trigger_config as "triggerConfig", action_config as "actionConfig",
               conditions, enabled, last_run_at as "lastRunAt", next_run_at as "nextRunAt",
               created_at as "createdAt", updated_at as "updatedAt"`,
    values,
  );
  return result.rows[0] ?? null;
}

export async function deleteAutomation(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM automations WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function deleteAutomationsByUserId(userId: string): Promise<number> {
  const result = await query(`DELETE FROM automations WHERE user_id = $1`, [userId]);
  return result.rowCount ?? 0;
}
