import {
  createUser,
  findUserById,
  findUserByEmail,
  updateUser,
} from '../repositories/users.repository';
import {
  createSession,
  findSessionById,
  findSessionsByUserId,
  findSessionByTokenHash,
  updateSession,
  deleteSession,
  deleteSessionsByUserId,
  deleteExpiredSessions,
  deleteRefreshToken,
  deleteRefreshTokensBySessionId,
  deleteExpiredRefreshTokens,
  createRefreshToken,
  findRefreshTokenById,
  findRefreshTokenByTokenHash,
  findRefreshTokensBySessionId,
} from '../repositories/sessions.repository';
import type { User, Session, RefreshToken } from '../repositories/types';

export async function createUserAuth(email: string, displayName: string): Promise<User> {
  return createUser(email, displayName);
}

export async function findUserByEmailAuth(email: string): Promise<User | null> {
  return findUserByEmail(email);
}

export async function findUserByIdAuth(id: string): Promise<User | null> {
  return findUserById(id);
}

export async function updateUserAuth(
  id: string,
  updates: Partial<Pick<User, 'email' | 'displayName'>>,
): Promise<User | null> {
  return updateUser(id, updates);
}

export async function createSessionAuth(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
  deviceId: string | null = null,
): Promise<Session> {
  return createSession(userId, tokenHash, expiresAt, deviceId);
}

export async function getSessionAuth(id: string): Promise<Session | null> {
  return findSessionById(id);
}

export async function getSessionsByUserIdAuth(userId: string): Promise<Session[]> {
  return findSessionsByUserId(userId);
}

export async function getSessionByTokenHashAuth(tokenHash: string): Promise<Session | null> {
  return findSessionByTokenHash(tokenHash);
}

export async function updateSessionAuth(
  id: string,
  updates: Partial<Pick<Session, 'deviceId' | 'tokenHash' | 'expiresAt'>>,
): Promise<Session | null> {
  return updateSession(id, updates);
}

export async function deleteSessionAuth(id: string): Promise<boolean> {
  return deleteSession(id);
}

export async function deleteSessionsByUserIdAuth(userId: string): Promise<number> {
  return deleteSessionsByUserId(userId);
}

export async function deleteExpiredSessionsAuth(): Promise<number> {
  return deleteExpiredSessions();
}

export async function deleteRefreshTokenAuth(id: string): Promise<boolean> {
  return deleteRefreshToken(id);
}

export async function deleteRefreshTokensBySessionIdAuth(sessionId: string): Promise<number> {
  return deleteRefreshTokensBySessionId(sessionId);
}

export async function deleteExpiredRefreshTokensAuth(): Promise<number> {
  return deleteExpiredRefreshTokens();
}

export async function createRefreshTokenAuth(
  sessionId: string,
  tokenHash: string,
  expiresAt: Date,
): Promise<RefreshToken> {
  return createRefreshToken(sessionId, tokenHash, expiresAt);
}

export async function getRefreshTokenAuth(id: string): Promise<RefreshToken | null> {
  return findRefreshTokenById(id);
}

export async function getRefreshTokenByTokenHashAuth(
  tokenHash: string,
): Promise<RefreshToken | null> {
  return findRefreshTokenByTokenHash(tokenHash);
}

export async function getRefreshTokensBySessionIdAuth(sessionId: string): Promise<RefreshToken[]> {
  return findRefreshTokensBySessionId(sessionId);
}
