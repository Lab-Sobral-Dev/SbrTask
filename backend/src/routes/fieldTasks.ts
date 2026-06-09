import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { adminMiddleware } from '../middlewares/admin';
import { tiOnlyMiddleware } from '../middlewares/tiOnly';
import { listFieldTasks, createFieldTask, updateFieldTask, startFieldTask, stopFieldTask } from '../controllers/fieldTaskController';

const router = Router();

// All field-task endpoints restricted to OU=TI users
router.get('/', authMiddleware, tiOnlyMiddleware, listFieldTasks);
router.post('/', authMiddleware, adminMiddleware, createFieldTask);
router.put('/:id', authMiddleware, adminMiddleware, updateFieldTask);
router.post('/:id/start', authMiddleware, tiOnlyMiddleware, startFieldTask);
router.post('/:id/stop', authMiddleware, tiOnlyMiddleware, stopFieldTask);

export default router;
