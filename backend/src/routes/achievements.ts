import { Router } from 'express';
import {
  getAchievements,
  getLeaderboard,
  createAchievement,
  updateAchievement,
  deleteAchievement,
} from '../controllers/achievementController';
import { authMiddleware } from '../middlewares/auth';
import { adminMiddleware } from '../middlewares/admin';

const router = Router();

router.get('/', authMiddleware, getAchievements);
router.get('/leaderboard', getLeaderboard);

router.post('/', authMiddleware, adminMiddleware, createAchievement);
router.put('/:id', authMiddleware, adminMiddleware, updateAchievement);
router.delete('/:id', authMiddleware, adminMiddleware, deleteAchievement);

export default router;
