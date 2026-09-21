import { Router } from 'express';
import authRoutes from './auth.routes';
import conversationRoutes from './conversation.routes';
import taskRoutes from './task.routes';
import deviceRoutes from './device.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/conversations', conversationRoutes);
router.use('/tasks', taskRoutes);
router.use('/devices', deviceRoutes);

export default router;
