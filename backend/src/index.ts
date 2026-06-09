import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import config from './config';
import { initSocket } from './socket';
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import achievementRoutes from './routes/achievements';
import notificationRoutes from './routes/notifications';
import webhookRoutes from './routes/webhooks';
import fieldTaskRoutes from './routes/fieldTasks';
import xpRoutes from './routes/xp';
import commissionRoutes from './routes/commission';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: config.corsOrigin, methods: ['GET', 'POST'] },
});

initSocket(io);

app.use(cors({ origin: config.corsOrigin }));

// capture raw body for webhook HMAC verification before json parser
app.use('/api/webhooks', (req: Request & { rawBody?: Buffer }, _res: Response, next: NextFunction) => {
  const chunks: Buffer[] = [];
  req.on('data', (chunk: Buffer) => chunks.push(chunk));
  req.on('end', () => { req.rawBody = Buffer.concat(chunks); next(); });
});

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/field-tasks', fieldTaskRoutes);
app.use('/api/xp', xpRoutes);
app.use('/api/commission', commissionRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

io.on('connection', (socket) => {
  socket.on('join-user-room', (userId: string) => {
    socket.join(`user-${userId}`);
  });

  socket.on('join-ranking', () => {
    socket.join('ranking-public');
  });
});

httpServer.listen(config.port, () => {
  console.log(`Servidor rodando na porta ${config.port}`);
});

export default app;
