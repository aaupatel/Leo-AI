import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import {
  listDevices,
  getDevice,
  createDeviceService,
  updateDeviceService,
  updateDeviceToken,
  updateDeviceLastSeen,
  deleteDeviceService,
} from '../services/device.service';
import { findUserByIdAuth, getSessionByTokenHashAuth } from '../services/auth.service';
import type { Device } from '../repositories/types';

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

    const devices = await listDevices(user.id);
    res.json({ devices });
  } catch (error) {
    console.error('List devices error:', error);
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

    const { name, platform, deviceToken } = req.body as {
      name?: string;
      platform?: string;
      deviceToken?: string | null;
    };

    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'name is required and must be a string' });
      return;
    }

    if (!platform || !['windows', 'android', 'web'].includes(platform)) {
      res.status(400).json({ error: 'platform must be one of: windows, android, web' });
      return;
    }

    if (deviceToken !== undefined && deviceToken !== null && typeof deviceToken !== 'string') {
      res.status(400).json({ error: 'deviceToken must be a string or null' });
      return;
    }

    const device = await createDeviceService(
      user.id,
      name,
      platform as Device['platform'],
      deviceToken ?? null,
    );
    res.status(201).json({ device });
  } catch (error) {
    console.error('Create device error:', error);
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
    const device = await getDevice(user.id, id);

    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    res.json({ device });
  } catch (error) {
    console.error('Get device error:', error);
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
    const { name, platform, deviceToken, lastSeenAt } = req.body as {
      name?: string;
      platform?: string;
      deviceToken?: string | null;
      lastSeenAt?: string | Date | null;
    };

    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      res.status(400).json({ error: 'name must be a non-empty string' });
      return;
    }

    if (platform !== undefined && !['windows', 'android', 'web'].includes(platform)) {
      res.status(400).json({ error: 'platform must be one of: windows, android, web' });
      return;
    }

    if (deviceToken !== undefined && deviceToken !== null && typeof deviceToken !== 'string') {
      res.status(400).json({ error: 'deviceToken must be a string or null' });
      return;
    }

    let parsedLastSeenAt: Date | null | undefined = undefined;
    if (lastSeenAt !== undefined) {
      parsedLastSeenAt =
        lastSeenAt === null ? null : lastSeenAt instanceof Date ? lastSeenAt : new Date(lastSeenAt);
      if (parsedLastSeenAt !== null && Number.isNaN(parsedLastSeenAt.getTime())) {
        res.status(400).json({ error: 'lastSeenAt must be a valid date' });
        return;
      }
    }

    const updates: Partial<Pick<Device, 'name' | 'platform' | 'deviceToken' | 'lastSeenAt'>> = {};
    if (name !== undefined) updates.name = name;
    if (platform !== undefined) updates.platform = platform as Device['platform'];
    if (deviceToken !== undefined) updates.deviceToken = deviceToken;
    if (parsedLastSeenAt !== undefined) updates.lastSeenAt = parsedLastSeenAt;

    const device = await updateDeviceService(user.id, id, updates);

    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    res.json({ device });
  } catch (error) {
    console.error('Update device error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/token', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const id = req.params.id as string;
    const { deviceToken } = req.body as { deviceToken?: string | null };

    if (deviceToken !== undefined && deviceToken !== null && typeof deviceToken !== 'string') {
      res.status(400).json({ error: 'deviceToken must be a string or null' });
      return;
    }

    const device = await updateDeviceToken(user.id, id, deviceToken ?? null);

    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    res.json({ device });
  } catch (error) {
    console.error('Update device token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/last-seen', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const id = req.params.id as string;
    const { lastSeenAt } = req.body as { lastSeenAt?: string | Date };

    const parsedLastSeenAt = lastSeenAt
      ? lastSeenAt instanceof Date
        ? lastSeenAt
        : new Date(lastSeenAt)
      : new Date();
    if (Number.isNaN(parsedLastSeenAt.getTime())) {
      res.status(400).json({ error: 'lastSeenAt must be a valid date' });
      return;
    }

    const device = await updateDeviceLastSeen(user.id, id, parsedLastSeenAt);

    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    res.json({ device });
  } catch (error) {
    console.error('Update device last seen error:', error);
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
    const success = await deleteDeviceService(user.id, id);

    if (!success) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
