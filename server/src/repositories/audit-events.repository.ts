import { query } from '../database';
import { AuditEvent } from './types';

export async function findAuditEventById(id: string): Promise<AuditEvent | null> {
  const result = await query<AuditEvent>(
    `SELECT id, user_id as "userId", event_type as "eventType",
            entity_type as "entityType", entity_id as "entityId",
            action, metadata, ip_address as "ipAddress", user_agent as "userAgent",
            created_at as "createdAt"
     FROM audit_events WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function listAuditEventsByUserId(
  userId: string,
  limit: number = 100,
  offset: number = 0,
): Promise<AuditEvent[]> {
  const result = await query<AuditEvent>(
    `SELECT id, user_id as "userId", event_type as "eventType",
            entity_type as "entityType", entity_id as "entityId",
            action, metadata, ip_address as "ipAddress", user_agent as "userAgent",
            created_at as "createdAt"
     FROM audit_events WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );
  return result.rows;
}

export async function listAuditEventsByEntity(
  entityType: string,
  entityId: string,
  limit: number = 100,
  offset: number = 0,
): Promise<AuditEvent[]> {
  const result = await query<AuditEvent>(
    `SELECT id, user_id as "userId", event_type as "eventType",
            entity_type as "entityType", entity_id as "entityId",
            action, metadata, ip_address as "ipAddress", user_agent as "userAgent",
            created_at as "createdAt"
     FROM audit_events WHERE entity_type = $1 AND entity_id = $2
     ORDER BY created_at DESC
     LIMIT $3 OFFSET $4`,
    [entityType, entityId, limit, offset],
  );
  return result.rows;
}

export async function createAuditEvent(
  userId: string,
  eventType: string,
  action: string,
  entityType: string | null = null,
  entityId: string | null = null,
  metadata: unknown | null = null,
  ipAddress: string | null = null,
  userAgent: string | null = null,
): Promise<AuditEvent> {
  const result = await query<AuditEvent>(
    `INSERT INTO audit_events (user_id, event_type, entity_type, entity_id, action, metadata, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, user_id as "userId", event_type as "eventType",
               entity_type as "entityType", entity_id as "entityId",
               action, metadata, ip_address as "ipAddress", user_agent as "userAgent",
               created_at as "createdAt"`,
    [userId, eventType, entityType, entityId, action, metadata, ipAddress, userAgent],
  );
  return result.rows[0];
}

// Note: No update or delete methods for audit_events as it is an append-only immutable log
