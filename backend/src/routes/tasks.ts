import { Router } from 'express';
import { 
  createTask, 
  getTasks, 
  getTaskById, 
  updateTask, 
  deleteTask, 
  completeTask,
  getStats 
} from '../controllers/taskController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// Todas as rotas precisam de autenticação
router.use(authMiddleware);

router.post('/', createTask);
router.get('/', getTasks);
router.get('/stats', getStats);
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.post('/:id/complete', completeTask);

export default router;