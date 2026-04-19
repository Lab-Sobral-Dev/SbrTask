import { Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from './auth';

export const adminMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user || user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  next();
};
