import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { xpEventsSSE } from '../controllers/xpController';

const router = Router();

router.get('/events', authMiddleware, xpEventsSSE);

export default router;
