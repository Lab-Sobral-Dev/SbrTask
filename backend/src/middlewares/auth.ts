import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';

export interface JwtPayload {
  sub:        string;
  name:       string;
  email:      string | null;
  department: string;
  role:       string;
}

export interface AuthRequest extends Request {
  userId?:      string;
  userPayload?: JwtPayload;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload   = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.userId      = payload.sub;
    req.userPayload = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};
