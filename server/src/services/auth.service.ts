import bcrypt from 'bcrypt';
import crypto from 'crypto';
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

const BCRYPT_ROUNDS = 12;
const SESSION_EXPIRY_DAYS = 30;
const REFRESH_TOKEN_EXPIRY_DAYS = 60;

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export async function registerUser(
  email: string,
  displayName: string,
  password: string,
): Promise<User> {
  const passwordHash = await hashPassword(password);
  return createUser(email, displayName, passwordHash);
}

export async function loginUser(
  email: string,
  password: string,
  deviceId: string | null = null,
): Promise<{
  user: User;
  session: Session;
  refreshToken: RefreshToken;
  accessToken: string;
  refreshTokenValue: string;
} | null> {
  const user = await findUserByEmail(email);
  if (!user || !user.passwordHash) {
    return null;
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  const accessToken = generateToken();
  const refreshTokenValue = generateToken();

  const sessionExpiresAt = addDays(new Date(), SESSION_EXPIRY_DAYS);
  const session = await createSession(user.id, hashToken(accessToken), sessionExpiresAt, deviceId);

  const refreshTokenExpiresAt = addDays(new Date(), REFRESH_TOKEN_EXPIRY_DAYS);
  const refreshToken = await createRefreshToken(
    session.id,
    hashToken(refreshTokenValue),
    refreshTokenExpiresAt,
  );

  const userWithoutPassword: User = {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
  return {
    user: userWithoutPassword,
    session,
    refreshToken,
    accessToken,
    refreshTokenValue,
  };
}

export async function refreshAccessToken(refreshTokenValue: string): Promise<{
  session: Session;
  refreshToken: RefreshToken;
  accessToken: string;
  refreshTokenValue: string;
} | null> {
  const refreshTokenHash = hashToken(refreshTokenValue);
  const refreshToken = await findRefreshTokenByTokenHash(refreshTokenHash);
  if (!refreshToken) {
    return null;
  }

  if (refreshToken.expiresAt < new Date()) {
    await deleteRefreshToken(refreshToken.id);
    return null;
  }

  const session = await findSessionById(refreshToken.sessionId);
  if (!session) {
    return null;
  }

  if (session.expiresAt < new Date()) {
    await deleteSession(session.id);
    return null;
  }

  await deleteRefreshToken(refreshToken.id);

  const newAccessToken = generateToken();
  const newRefreshTokenValue = generateToken();

  const newSessionExpiresAt = addDays(new Date(), SESSION_EXPIRY_DAYS);
  await updateSession(session.id, {
    tokenHash: hashToken(newAccessToken),
    expiresAt: newSessionExpiresAt,
  });

  const newRefreshTokenExpiresAt = addDays(new Date(), REFRESH_TOKEN_EXPIRY_DAYS);
  const newRefreshToken = await createRefreshToken(
    session.id,
    hashToken(newRefreshTokenValue),
    newRefreshTokenExpiresAt,
  );

  return {
    session: { ...session, tokenHash: hashToken(newAccessToken), expiresAt: newSessionExpiresAt },
    refreshToken: newRefreshToken,
    accessToken: newAccessToken,
    refreshTokenValue: newRefreshTokenValue,
  };
}

export async function logoutUser(sessionId: string): Promise<boolean> {
  return deleteSession(sessionId);
}

export async function logoutAllUserSessions(userId: string): Promise<number> {
  return deleteSessionsByUserId(userId);
}

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
  updates: Partial<Pick<User, 'email' | 'displayName' | 'passwordHash'>>,
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
