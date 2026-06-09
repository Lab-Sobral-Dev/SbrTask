import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { adminMiddleware } from '../middlewares/admin';
import { listFieldTasks, createFieldTask, updateFieldTask, startFieldTask, stopFieldTask } from '../controllers/fieldTaskController';

const router = Router();

router.get('/', authMiddleware, listFieldTasks);
router.post('/', authMiddleware, adminMiddleware, createFieldTask);
router.put('/:id', authMiddleware, adminMiddleware, updateFieldTask);
router.post('/:id/start', authMiddleware, startFieldTask);
router.post('/:id/stop', authMiddleware, stopFieldTask);

export default router;
