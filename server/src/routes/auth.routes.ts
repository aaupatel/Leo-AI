import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  logoutAllUserSessions,
  findUserByIdAuth,
  findUserByEmailAuth,
  getSessionsByUserIdAuth,
  getSessionByTokenHashAuth,
  hashPassword,
  verifyPassword,
  updateUserAuth,
} from '../services/auth.service';
import type { User } from '../repositories/types';

const router = Router();

interface AuthenticatedRequest extends Request {
  user?: User;
  sessionId?: string;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
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
  const tokenHash = hashToken(token);

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

  req.user = user;
  req.sessionId = session.id;
  next();
}

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, displayName, password } = req.body as {
      email?: string;
      displayName?: string;
      password?: string;
    };

    if (!email || !displayName || !password) {
      res.status(400).json({ error: 'email, displayName, and password are required' });
      return;
    }

    if (
      typeof email !== 'string' ||
      typeof displayName !== 'string' ||
      typeof password !== 'string'
    ) {
      res.status(400).json({ error: 'email, displayName, and password must be strings' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }

    const existingUser = await findUserByEmailAuth(email);
    if (existingUser) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const user = await registerUser(email, displayName, password);
    const userWithoutPassword = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(201).json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, deviceId } = req.body as {
      email?: string;
      password?: string;
      deviceId?: string | null;
    };

    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required' });
      return;
    }

    const result = await loginUser(email, password, deviceId ?? null);
    if (!result) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const user = result.user;
    const userWithoutPassword = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.json({
      user: userWithoutPassword,
      accessToken: result.accessToken,
      refreshToken: result.refreshTokenValue,
      session: {
        id: result.session.id,
        expiresAt: result.session.expiresAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };

    if (!refreshToken) {
      res.status(400).json({ error: 'refreshToken is required' });
      return;
    }

    const result = await refreshAccessToken(refreshToken);
    if (!result) {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }

    res.json({
      accessToken: result.accessToken,
      refreshToken: result.refreshTokenValue,
      session: {
        id: result.session.id,
        expiresAt: result.session.expiresAt,
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sessionId = req.sessionId;
    if (!sessionId) {
      res.status(400).json({ error: 'Session not found' });
      return;
    }

    const success = await logoutUser(sessionId);
    if (!success) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout-all', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const count = await logoutAllUserSessions(user.id);
    res.json({ message: `Logged out from ${count} session(s)` });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const userWithoutPassword = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/sessions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const sessions = await getSessionsByUserIdAuth(user.id);
    const sessionsWithoutTokens = sessions.map((session) => ({
      id: session.id,
      userId: session.userId,
      deviceId: session.deviceId,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
    }));
    res.json({ sessions: sessionsWithoutTokens });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { displayName, email, currentPassword, newPassword } = req.body as {
      displayName?: string;
      email?: string;
      currentPassword?: string;
      newPassword?: string;
    };

    if (email && email !== user.email) {
      const existingUser = await findUserByEmailAuth(email);
      if (existingUser) {
        res.status(409).json({ error: 'Email already in use' });
        return;
      }
    }

    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({ error: 'Current password required to change password' });
        return;
      }
      const isValid = await verifyPassword(currentPassword, user.passwordHash ?? '');
      if (!isValid) {
        res.status(401).json({ error: 'Current password is incorrect' });
        return;
      }
      if (newPassword.length < 8) {
        res.status(400).json({ error: 'New password must be at least 8 characters' });
        return;
      }
      const newPasswordHash = await hashPassword(newPassword);
      await updateUserAuth(user.id, {
        email: email ?? user.email,
        displayName: displayName ?? user.displayName,
      });
      const updatedUser = await findUserByIdAuth(user.id);
      if (updatedUser) {
        await updateUserAuth(user.id, {
          email: updatedUser.email,
          displayName: updatedUser.displayName,
          passwordHash: newPasswordHash,
        });
      }
    } else {
      await updateUserAuth(user.id, {
        email: email ?? user.email,
        displayName: displayName ?? user.displayName,
      });
    }

    const updatedUser = await findUserByIdAuth(user.id);
    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const userWithoutPassword = {
      id: updatedUser.id,
      email: updatedUser.email,
      displayName: updatedUser.displayName,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
