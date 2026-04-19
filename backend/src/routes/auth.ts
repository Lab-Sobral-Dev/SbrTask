import { Router } from 'express';
import { register, login, getMe, getXPToNextLevel, getUsers } from '../controllers/authController';
import { authMiddleware } from '../middlewares/auth';
import { adminMiddleware } from '../middlewares/admin';

const router = Router();

router.post('/register', register);
router.post('/login', login);

router.get('/me', authMiddleware, getMe);
router.get('/xp', authMiddleware, getXPToNextLevel);
router.get('/users', authMiddleware, adminMiddleware, getUsers);

export default router;
