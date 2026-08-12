import { Router } from 'express';
import {
  createTask,
  getTasks,
  getPendingApproval,
  getTaskById,
  updateTask,
  deleteTask,
  updateAssignment,
  approveAssignment,
  approveTask,
  rejectTask,
  updateChecklist,
  resubmitTask,
  getStats,
} from '../controllers/taskController';
import { authMiddleware } from '../middlewares/auth';
import { adminMiddleware } from '../middlewares/admin';

const router = Router();

router.use(authMiddleware);

router.post('/', adminMiddleware, createTask);
router.get('/', getTasks);
router.get('/stats', getStats);
router.get('/pending-approval', adminMiddleware, getPendingApproval);
router.post('/:id/approve', adminMiddleware, approveTask);
router.post('/:id/reject', adminMiddleware, rejectTask);
router.patch('/:id/checklist', adminMiddleware, updateChecklist);
router.post('/:id/resubmit', adminMiddleware, resubmitTask);
router.get('/:id', getTaskById);
router.put('/:id', adminMiddleware, updateTask);
router.delete('/:id', adminMiddleware, deleteTask);
router.patch('/:id/assignment', updateAssignment);
router.patch('/:id/assignment/:userId/approve', adminMiddleware, approveAssignment);

export default router;
