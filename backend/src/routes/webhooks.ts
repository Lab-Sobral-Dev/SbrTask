import { Router } from 'express';
import { handleGithubWebhook } from '../controllers/githubWebhookController';

const router = Router();

// raw body needed for HMAC verification — mounted before express.json()
router.post('/github', handleGithubWebhook);

export default router;
