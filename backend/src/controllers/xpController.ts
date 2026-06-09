import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { getIo } from '../socket';

// SSE endpoint — Token Town subscribes to real-time XP events
// Requires JWT. User-scoped events filtered to req.userId; commission_cycle only for admins.
export const xpEventsSSE = (req: AuthRequest, res: Response): void => {
  const userId = req.userId!;
  const isAdmin = req.userPayload?.role === 'admin';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  send('connected', { ts: new Date().toISOString() });

  const io = getIo();

  const onXpEarned = (data: any) => { if (data?.userId === userId) send('xp_earned', data); };
  const onLevelUp = (data: any) => { if (data?.userId === userId) send('level_up', data); };
  const onTaskCompleted = (data: any) => { if (data?.userId === userId) send('task_completed', data); };
  const onCommissionCycle = (data: unknown) => { if (isAdmin) send('commission_cycle', data); };

  io.on('xp_earned', onXpEarned);
  io.on('level_up', onLevelUp);
  io.on('task_completed', onTaskCompleted);
  io.on('commission_cycle', onCommissionCycle);

  const hb = setInterval(() => res.write(': heartbeat\n\n'), 25_000);

  req.on('close', () => {
    clearInterval(hb);
    io.off('xp_earned', onXpEarned);
    io.off('level_up', onLevelUp);
    io.off('task_completed', onTaskCompleted);
    io.off('commission_cycle', onCommissionCycle);
  });
};
