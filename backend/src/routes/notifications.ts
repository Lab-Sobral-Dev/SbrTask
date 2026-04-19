import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { getNotifications, markAllRead } from '../controllers/notificationController';

const router = Router();

router.use(authMiddleware);

router.get('/', getNotifications);
router.patch('/read-all', markAllRead);

export default router;
