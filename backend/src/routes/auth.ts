import { Router } from 'express';
import { register, login, getMe, getXPToNextLevel } from '../controllers/authController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// Rotas públicas
router.post('/register', register);
router.post('/login', login);

// Rotas protegidas
router.get('/me', authMiddleware, getMe);
router.get('/xp', authMiddleware, getXPToNextLevel);

export default router;