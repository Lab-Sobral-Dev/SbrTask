import { Router } from 'express';
import { z } from 'zod';
import { login, getMe, getUsers, updateUser } from '../controllers/authController';
import { authMiddleware } from '../middlewares/auth';
import { adminMiddleware } from '../middlewares/admin';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos' });
  req.body = parsed.data;
  return login(req, res);
});

router.get('/me', authMiddleware, getMe);
router.get('/users', authMiddleware, adminMiddleware, getUsers);
router.patch('/users/:id', authMiddleware, adminMiddleware, updateUser);

router.post('/logout', authMiddleware, (_req, res) => {
  return res.json({ message: 'Logout realizado com sucesso' });
});

export default router;
