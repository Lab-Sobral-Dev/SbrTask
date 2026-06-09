import { Router } from 'express';
import { xpEventsSSE } from '../controllers/xpController';

const router = Router();

router.get('/events', xpEventsSSE);

export default router;
