import { Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from './auth';

export const tiOnlyMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { department: true, active: true },
  });
  if (!user || !user.active || user.department !== 'ti') {
    res.status(403).json({ error: 'Acesso restrito à equipe de TI.' });
    return;
  }
  next();
};
