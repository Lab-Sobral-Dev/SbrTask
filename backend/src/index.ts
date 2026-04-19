import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import config from './config';
import { initSocket } from './socket';
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import achievementRoutes from './routes/achievements';
import notificationRoutes from './routes/notifications';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: config.corsOrigin, methods: ['GET', 'POST'] },
});

initSocket(io);

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

io.on('connection', (socket) => {
  socket.on('join-user-room', (userId: string) => {
    socket.join(`user-${userId}`);
  });
});

httpServer.listen(config.port, () => {
  console.log(`Servidor rodando na porta ${config.port}`);
});

export default app;
