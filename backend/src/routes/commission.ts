import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { adminMiddleware } from '../middlewares/admin';
import { getCurrentCycle, closeCycle, upsertCommissionConfig, listCommissionConfig } from '../controllers/commissionController';

const router = Router();

router.get('/current', authMiddleware, adminMiddleware, getCurrentCycle);
router.post('/close', authMiddleware, adminMiddleware, closeCycle);
router.get('/config', authMiddleware, adminMiddleware, listCommissionConfig);
router.put('/config', authMiddleware, adminMiddleware, upsertCommissionConfig);

export default router;
