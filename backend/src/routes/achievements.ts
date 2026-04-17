import { Router } from 'express';
import { getAchievements, getLeaderboard } from '../controllers/achievementController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.get('/', authMiddleware, getAchievements);
router.get('/leaderboard', getLeaderboard);

export default router;