export interface User {
  id: string;
  email: string;
  displayName: string;
  passwordHash?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Device {
  id: string;
  userId: string;
  name: string;
  platform: 'windows' | 'android' | 'web';
  deviceToken: string | null;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  deviceId: string | null;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface RefreshToken {
  id: string;
  sessionId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string | null;
  modelProvider: string | null;
  modelName: string | null;
  systemPrompt: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls: unknown | null;
  toolCallId: string | null;
  metadata: unknown | null;
  createdAt: Date;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: number;
  dueAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reminder {
  id: string;
  taskId: string;
  userId: string;
  triggerAt: Date;
  deliveryMethod: 'push' | 'email' | 'in_app';
  payload: unknown | null;
  sentAt: Date | null;
  createdAt: Date;
}

export interface Automation {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  triggerConfig: unknown;
  actionConfig: unknown;
  conditions: unknown | null;
  enabled: boolean;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Memory {
  id: string;
  userId: string;
  type: 'fact' | 'preference' | 'context' | 'summary';
  key: string;
  value: string;
  embedding: Buffer | null;
  sourceConversationId: string | null;
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Integration {
  id: string;
  userId: string;
  provider: string;
  displayName: string;
  config: unknown;
  credentialsRef: string | null;
  status: 'connected' | 'disconnected' | 'error';
  lastSyncAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'reminder' | 'automation' | 'system' | 'integration';
  title: string;
  body: string;
  data: unknown | null;
  priority: number;
  readAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
}

export interface AuditEvent {
  id: string;
  userId: string;
  eventType: string;
  entityType: string | null;
  entityId: string | null;
  action: string;
  metadata: unknown | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}
