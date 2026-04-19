import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middlewares/auth';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const notificationList = await prisma.notification.findMany({
      where: { userId: authReq.userId! },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notificationList);
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
};

export const markAllRead = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    await prisma.notification.updateMany({
      where: { userId: authReq.userId!, read: false },
      data: { read: true },
    });
    res.json({ message: 'Notificações marcadas como lidas' });
  } catch (error) {
    console.error('Erro ao marcar notificações:', error);
    res.status(500).json({ error: 'Erro ao marcar notificações' });
  }
};
