import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import config from '../config';
import { AuthRequest } from '../middlewares/auth';

interface RegisterBody {
  email: string;
  password: string;
  name: string;
  sector: string;
  avatar?: object;
}

interface LoginBody {
  email: string;
  password: string;
}

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, sector, avatar } = req.body as RegisterBody;

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        sector,
        avatar: avatar || {
          skinTone: '#F5D0B5',
          hairStyle: 'hair-1',
          hairColor: '#4A3728',
          eyes: { color: '#4B7B4B', shape: 'round' },
          outfit: 'outfit-1',
          accessories: []
        }
      }
    });

    // Gerar token
    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '7d' });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        sector: user.sector,
        role: user.role,
        level: user.level,
        xp: user.xp,
        avatar: user.avatar
      },
      token
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as LoginBody;

    // Buscar usuário
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    // Gerar token
    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '7d' });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        sector: user.sector,
        role: user.role,
        level: user.level,
        xp: user.xp,
        avatar: user.avatar
      },
      token
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest & { userId: string };
    
    const user = await prisma.user.findUnique({
      where: { id: authReq.userId },
      select: {
        id: true,
        email: true,
        name: true,
        sector: true,
        role: true,
        level: true,
        xp: true,
        avatar: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
  }
};

// Função para calcular nível baseado no XP
const calculateLevel = (xp: number): number => {
  // Fórmula: XP necessária = 100 * nível ^ 1.5
  let level = 1;
  let xpNeeded = 0;
  
  while (xpNeeded <= xp) {
    level++;
    xpNeeded += Math.floor(100 * Math.pow(level, 1.5));
  }
  
  return level - 1;
};

// XP necessário para o próximo nível
export const getXPToNextLevel = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest & { userId: string };
    
    const user = await prisma.user.findUnique({
      where: { id: authReq.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const currentLevel = user.level;
    const currentXP = user.xp;
    
    // Calcular XP para próximo nível
    let xpForCurrentLevel = 0;
    for (let i = 1; i < currentLevel; i++) {
      xpForCurrentLevel += Math.floor(100 * Math.pow(i, 1.5));
    }
    
    const xpForNextLevel = Math.floor(100 * Math.pow(currentLevel, 1.5));
    const xpProgress = currentXP - xpForCurrentLevel;

    res.json({
      currentLevel,
      currentXP,
      xpForNextLevel,
      xpProgress,
      xpNeeded: xpForNextLevel - xpProgress
    });
  } catch (error) {
    console.error('Erro ao calcular XP:', error);
    res.status(500).json({ error: 'Erro ao calcular XP' });
  }
};