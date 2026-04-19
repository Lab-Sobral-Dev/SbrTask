import { Router } from 'express';
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  updateAssignment,
  approveAssignment,
  getStats,
} from '../controllers/taskController';
import { authMiddleware } from '../middlewares/auth';
import { adminMiddleware } from '../middlewares/admin';

const router = Router();

router.use(authMiddleware);

router.post('/', adminMiddleware, createTask);
router.get('/', getTasks);
router.get('/stats', getStats);
router.get('/:id', getTaskById);
router.put('/:id', adminMiddleware, updateTask);
router.delete('/:id', adminMiddleware, deleteTask);
router.patch('/:id/assignment', updateAssignment);
router.patch('/:id/assignment/:userId/approve', adminMiddleware, approveAssignment);

export default router;
