import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../repositories/users.repository', () => ({
  createUser: vi.fn(),
  findUserById: vi.fn(),
  findUserByEmail: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock('../repositories/sessions.repository', () => ({
  createSession: vi.fn(),
  findSessionById: vi.fn(),
  findSessionsByUserId: vi.fn(),
  findSessionByTokenHash: vi.fn(),
  updateSession: vi.fn(),
  deleteSession: vi.fn(),
  deleteSessionsByUserId: vi.fn(),
  deleteExpiredSessions: vi.fn(),
  deleteRefreshToken: vi.fn(),
  deleteRefreshTokensBySessionId: vi.fn(),
  deleteExpiredRefreshTokens: vi.fn(),
  createRefreshToken: vi.fn(),
  findRefreshTokenById: vi.fn(),
  findRefreshTokenByTokenHash: vi.fn(),
  findRefreshTokensBySessionId: vi.fn(),
}));

import {
  createUserAuth,
  findUserByEmailAuth,
  findUserByIdAuth,
  updateUserAuth,
  createSessionAuth,
  getSessionAuth,
  getSessionsByUserIdAuth,
  getSessionByTokenHashAuth,
  updateSessionAuth,
  deleteSessionAuth,
  deleteSessionsByUserIdAuth,
  deleteExpiredSessionsAuth,
  deleteRefreshTokenAuth,
  deleteRefreshTokensBySessionIdAuth,
  deleteExpiredRefreshTokensAuth,
  createRefreshTokenAuth,
  getRefreshTokenAuth,
  getRefreshTokenByTokenHashAuth,
  getRefreshTokensBySessionIdAuth,
} from './auth.service';

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

describe('auth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('User operations', () => {
    const mockUser: User = {
      id: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    describe('createUserAuth', () => {
      it('calls createUser with email and displayName and returns the result', async () => {
        vi.mocked(createUser).mockResolvedValue(mockUser);
        const result = await createUserAuth('test@example.com', 'Test User');
        expect(createUser).toHaveBeenCalledWith('test@example.com', 'Test User');
        expect(result).toEqual(mockUser);
      });
    });

    describe('findUserByEmailAuth', () => {
      it('calls findUserByEmail and returns the user when found', async () => {
        vi.mocked(findUserByEmail).mockResolvedValue(mockUser);
        const result = await findUserByEmailAuth('test@example.com');
        expect(findUserByEmail).toHaveBeenCalledWith('test@example.com');
        expect(result).toEqual(mockUser);
      });

      it('returns null when user not found', async () => {
        vi.mocked(findUserByEmail).mockResolvedValue(null);
        const result = await findUserByEmailAuth('notfound@example.com');
        expect(findUserByEmail).toHaveBeenCalledWith('notfound@example.com');
        expect(result).toBeNull();
      });
    });

    describe('findUserByIdAuth', () => {
      it('calls findUserById and returns the user when found', async () => {
        vi.mocked(findUserById).mockResolvedValue(mockUser);
        const result = await findUserByIdAuth('user-123');
        expect(findUserById).toHaveBeenCalledWith('user-123');
        expect(result).toEqual(mockUser);
      });

      it('returns null when user not found', async () => {
        vi.mocked(findUserById).mockResolvedValue(null);
        const result = await findUserByIdAuth('notfound');
        expect(findUserById).toHaveBeenCalledWith('notfound');
        expect(result).toBeNull();
      });
    });

    describe('updateUserAuth', () => {
      it('calls updateUser with id and updates and returns the result', async () => {
        const updatedUser = { ...mockUser, displayName: 'Updated Name' };
        vi.mocked(updateUser).mockResolvedValue(updatedUser);
        const result = await updateUserAuth('user-123', { displayName: 'Updated Name' });
        expect(updateUser).toHaveBeenCalledWith('user-123', { displayName: 'Updated Name' });
        expect(result).toEqual(updatedUser);
      });

      it('returns null when user not found', async () => {
        vi.mocked(updateUser).mockResolvedValue(null);
        const result = await updateUserAuth('notfound', { email: 'new@example.com' });
        expect(updateUser).toHaveBeenCalledWith('notfound', { email: 'new@example.com' });
        expect(result).toBeNull();
      });

      it('passes through partial updates correctly', async () => {
        vi.mocked(updateUser).mockResolvedValue(mockUser);
        await updateUserAuth('user-123', { email: 'new@example.com' });
        await updateUserAuth('user-123', { displayName: 'New Name' });
        expect(updateUser).toHaveBeenCalledWith('user-123', { email: 'new@example.com' });
        expect(updateUser).toHaveBeenCalledWith('user-123', { displayName: 'New Name' });
      });
    });
  });

  describe('Session operations', () => {
    const mockSession: Session = {
      id: 'session-123',
      userId: 'user-123',
      deviceId: 'device-123',
      tokenHash: 'hash-abc',
      expiresAt: new Date('2024-12-31'),
      createdAt: new Date('2024-01-01'),
    };

    describe('createSessionAuth', () => {
      it('calls createSession with all parameters and returns the session', async () => {
        vi.mocked(createSession).mockResolvedValue(mockSession);
        const expiresAt = new Date('2024-12-31');
        const result = await createSessionAuth('user-123', 'hash-abc', expiresAt, 'device-123');
        expect(createSession).toHaveBeenCalledWith('user-123', 'hash-abc', expiresAt, 'device-123');
        expect(result).toEqual(mockSession);
      });

      it('passes null deviceId when not provided (default)', async () => {
        vi.mocked(createSession).mockResolvedValue(mockSession);
        const expiresAt = new Date('2024-12-31');
        await createSessionAuth('user-123', 'hash-abc', expiresAt);
        expect(createSession).toHaveBeenCalledWith('user-123', 'hash-abc', expiresAt, null);
      });

      it('passes explicit null deviceId', async () => {
        vi.mocked(createSession).mockResolvedValue(mockSession);
        const expiresAt = new Date('2024-12-31');
        await createSessionAuth('user-123', 'hash-abc', expiresAt, null);
        expect(createSession).toHaveBeenCalledWith('user-123', 'hash-abc', expiresAt, null);
      });
    });

    describe('getSessionAuth', () => {
      it('calls findSessionById and returns session when found', async () => {
        vi.mocked(findSessionById).mockResolvedValue(mockSession);
        const result = await getSessionAuth('session-123');
        expect(findSessionById).toHaveBeenCalledWith('session-123');
        expect(result).toEqual(mockSession);
      });

      it('returns null when session not found', async () => {
        vi.mocked(findSessionById).mockResolvedValue(null);
        const result = await getSessionAuth('notfound');
        expect(findSessionById).toHaveBeenCalledWith('notfound');
        expect(result).toBeNull();
      });
    });

    describe('getSessionsByUserIdAuth', () => {
      it('calls findSessionsByUserId and returns array of sessions', async () => {
        const sessions = [mockSession, { ...mockSession, id: 'session-456' }];
        vi.mocked(findSessionsByUserId).mockResolvedValue(sessions);
        const result = await getSessionsByUserIdAuth('user-123');
        expect(findSessionsByUserId).toHaveBeenCalledWith('user-123');
        expect(result).toEqual(sessions);
      });

      it('returns empty array when no sessions', async () => {
        vi.mocked(findSessionsByUserId).mockResolvedValue([]);
        const result = await getSessionsByUserIdAuth('user-123');
        expect(findSessionsByUserId).toHaveBeenCalledWith('user-123');
        expect(result).toEqual([]);
      });
    });

    describe('getSessionByTokenHashAuth', () => {
      it('calls findSessionByTokenHash and returns session when found', async () => {
        vi.mocked(findSessionByTokenHash).mockResolvedValue(mockSession);
        const result = await getSessionByTokenHashAuth('hash-abc');
        expect(findSessionByTokenHash).toHaveBeenCalledWith('hash-abc');
        expect(result).toEqual(mockSession);
      });

      it('returns null when session not found', async () => {
        vi.mocked(findSessionByTokenHash).mockResolvedValue(null);
        const result = await getSessionByTokenHashAuth('unknown');
        expect(findSessionByTokenHash).toHaveBeenCalledWith('unknown');
        expect(result).toBeNull();
      });
    });

    describe('updateSessionAuth', () => {
      it('calls updateSession with id and updates and returns updated session', async () => {
        const updatedSession = { ...mockSession, tokenHash: 'new-hash' };
        vi.mocked(updateSession).mockResolvedValue(updatedSession);
        const result = await updateSessionAuth('session-123', { tokenHash: 'new-hash' });
        expect(updateSession).toHaveBeenCalledWith('session-123', { tokenHash: 'new-hash' });
        expect(result).toEqual(updatedSession);
      });

      it('returns null when session not found', async () => {
        vi.mocked(updateSession).mockResolvedValue(null);
        const result = await updateSessionAuth('notfound', { deviceId: 'device-456' });
        expect(updateSession).toHaveBeenCalledWith('notfound', { deviceId: 'device-456' });
        expect(result).toBeNull();
      });

      it('passes through partial updates correctly', async () => {
        vi.mocked(updateSession).mockResolvedValue(mockSession);
        await updateSessionAuth('session-123', { deviceId: 'device-456' });
        await updateSessionAuth('session-123', { tokenHash: 'new-hash' });
        await updateSessionAuth('session-123', { expiresAt: new Date('2025-01-01') });
        expect(updateSession).toHaveBeenCalledWith('session-123', { deviceId: 'device-456' });
        expect(updateSession).toHaveBeenCalledWith('session-123', { tokenHash: 'new-hash' });
        expect(updateSession).toHaveBeenCalledWith('session-123', {
          expiresAt: new Date('2025-01-01'),
        });
      });
    });

    describe('deleteSessionAuth', () => {
      it('calls deleteSession and returns true when deleted', async () => {
        vi.mocked(deleteSession).mockResolvedValue(true);
        const result = await deleteSessionAuth('session-123');
        expect(deleteSession).toHaveBeenCalledWith('session-123');
        expect(result).toBe(true);
      });

      it('returns false when session not found', async () => {
        vi.mocked(deleteSession).mockResolvedValue(false);
        const result = await deleteSessionAuth('notfound');
        expect(deleteSession).toHaveBeenCalledWith('notfound');
        expect(result).toBe(false);
      });
    });

    describe('deleteSessionsByUserIdAuth', () => {
      it('calls deleteSessionsByUserId and returns count', async () => {
        vi.mocked(deleteSessionsByUserId).mockResolvedValue(3);
        const result = await deleteSessionsByUserIdAuth('user-123');
        expect(deleteSessionsByUserId).toHaveBeenCalledWith('user-123');
        expect(result).toBe(3);
      });

      it('returns 0 when no sessions deleted', async () => {
        vi.mocked(deleteSessionsByUserId).mockResolvedValue(0);
        const result = await deleteSessionsByUserIdAuth('user-123');
        expect(deleteSessionsByUserId).toHaveBeenCalledWith('user-123');
        expect(result).toBe(0);
      });
    });

    describe('deleteExpiredSessionsAuth', () => {
      it('calls deleteExpiredSessions and returns count', async () => {
        vi.mocked(deleteExpiredSessions).mockResolvedValue(5);
        const result = await deleteExpiredSessionsAuth();
        expect(deleteExpiredSessions).toHaveBeenCalled();
        expect(result).toBe(5);
      });

      it('returns 0 when no expired sessions', async () => {
        vi.mocked(deleteExpiredSessions).mockResolvedValue(0);
        const result = await deleteExpiredSessionsAuth();
        expect(deleteExpiredSessions).toHaveBeenCalled();
        expect(result).toBe(0);
      });
    });
  });

  describe('Refresh-token operations', () => {
    const mockRefreshToken: RefreshToken = {
      id: 'refresh-123',
      sessionId: 'session-123',
      tokenHash: 'refresh-hash-abc',
      expiresAt: new Date('2024-12-31'),
      createdAt: new Date('2024-01-01'),
    };

    describe('createRefreshTokenAuth', () => {
      it('calls createRefreshToken with sessionId, tokenHash, expiresAt and returns token', async () => {
        vi.mocked(createRefreshToken).mockResolvedValue(mockRefreshToken);
        const expiresAt = new Date('2024-12-31');
        const result = await createRefreshTokenAuth('session-123', 'refresh-hash-abc', expiresAt);
        expect(createRefreshToken).toHaveBeenCalledWith(
          'session-123',
          'refresh-hash-abc',
          expiresAt,
        );
        expect(result).toEqual(mockRefreshToken);
      });
    });

    describe('getRefreshTokenAuth', () => {
      it('calls findRefreshTokenById and returns token when found', async () => {
        vi.mocked(findRefreshTokenById).mockResolvedValue(mockRefreshToken);
        const result = await getRefreshTokenAuth('refresh-123');
        expect(findRefreshTokenById).toHaveBeenCalledWith('refresh-123');
        expect(result).toEqual(mockRefreshToken);
      });

      it('returns null when refresh token not found', async () => {
        vi.mocked(findRefreshTokenById).mockResolvedValue(null);
        const result = await getRefreshTokenAuth('notfound');
        expect(findRefreshTokenById).toHaveBeenCalledWith('notfound');
        expect(result).toBeNull();
      });
    });

    describe('getRefreshTokenByTokenHashAuth', () => {
      it('calls findRefreshTokenByTokenHash and returns token when found', async () => {
        vi.mocked(findRefreshTokenByTokenHash).mockResolvedValue(mockRefreshToken);
        const result = await getRefreshTokenByTokenHashAuth('refresh-hash-abc');
        expect(findRefreshTokenByTokenHash).toHaveBeenCalledWith('refresh-hash-abc');
        expect(result).toEqual(mockRefreshToken);
      });

      it('returns null when refresh token not found', async () => {
        vi.mocked(findRefreshTokenByTokenHash).mockResolvedValue(null);
        const result = await getRefreshTokenByTokenHashAuth('unknown');
        expect(findRefreshTokenByTokenHash).toHaveBeenCalledWith('unknown');
        expect(result).toBeNull();
      });
    });

    describe('getRefreshTokensBySessionIdAuth', () => {
      it('calls findRefreshTokensBySessionId and returns array of tokens', async () => {
        const tokens = [mockRefreshToken, { ...mockRefreshToken, id: 'refresh-456' }];
        vi.mocked(findRefreshTokensBySessionId).mockResolvedValue(tokens);
        const result = await getRefreshTokensBySessionIdAuth('session-123');
        expect(findRefreshTokensBySessionId).toHaveBeenCalledWith('session-123');
        expect(result).toEqual(tokens);
      });

      it('returns empty array when no refresh tokens', async () => {
        vi.mocked(findRefreshTokensBySessionId).mockResolvedValue([]);
        const result = await getRefreshTokensBySessionIdAuth('session-123');
        expect(findRefreshTokensBySessionId).toHaveBeenCalledWith('session-123');
        expect(result).toEqual([]);
      });
    });

    describe('deleteRefreshTokenAuth', () => {
      it('calls deleteRefreshToken and returns true when deleted', async () => {
        vi.mocked(deleteRefreshToken).mockResolvedValue(true);
        const result = await deleteRefreshTokenAuth('refresh-123');
        expect(deleteRefreshToken).toHaveBeenCalledWith('refresh-123');
        expect(result).toBe(true);
      });

      it('returns false when refresh token not found', async () => {
        vi.mocked(deleteRefreshToken).mockResolvedValue(false);
        const result = await deleteRefreshTokenAuth('notfound');
        expect(deleteRefreshToken).toHaveBeenCalledWith('notfound');
        expect(result).toBe(false);
      });
    });

    describe('deleteRefreshTokensBySessionIdAuth', () => {
      it('calls deleteRefreshTokensBySessionId and returns count', async () => {
        vi.mocked(deleteRefreshTokensBySessionId).mockResolvedValue(2);
        const result = await deleteRefreshTokensBySessionIdAuth('session-123');
        expect(deleteRefreshTokensBySessionId).toHaveBeenCalledWith('session-123');
        expect(result).toBe(2);
      });

      it('returns 0 when no refresh tokens deleted', async () => {
        vi.mocked(deleteRefreshTokensBySessionId).mockResolvedValue(0);
        const result = await deleteRefreshTokensBySessionIdAuth('session-123');
        expect(deleteRefreshTokensBySessionId).toHaveBeenCalledWith('session-123');
        expect(result).toBe(0);
      });
    });

    describe('deleteExpiredRefreshTokensAuth', () => {
      it('calls deleteExpiredRefreshTokens and returns count', async () => {
        vi.mocked(deleteExpiredRefreshTokens).mockResolvedValue(4);
        const result = await deleteExpiredRefreshTokensAuth();
        expect(deleteExpiredRefreshTokens).toHaveBeenCalled();
        expect(result).toBe(4);
      });

      it('returns 0 when no expired refresh tokens', async () => {
        vi.mocked(deleteExpiredRefreshTokens).mockResolvedValue(0);
        const result = await deleteExpiredRefreshTokensAuth();
        expect(deleteExpiredRefreshTokens).toHaveBeenCalled();
        expect(result).toBe(0);
      });
    });
  });
});
