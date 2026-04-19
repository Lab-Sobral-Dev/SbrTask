import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middlewares/auth';

// seed de conquistas padrão
const defaultAchievements = [
  { name: 'Primeira Tarefa', description: 'Complete sua primeira tarefa', icon: 'trophy', requirement: 1, type: 'milestone', xpReward: 10 },
  { name: 'Dez Tarefas', description: 'Complete 10 tarefas', icon: 'medal', requirement: 10, type: 'milestone', xpReward: 50 },
  { name: 'Cinquenta Tarefas', description: 'Complete 50 tarefas', icon: 'award', requirement: 50, type: 'milestone', xpReward: 100 },
  { name: 'Cem Tarefas', description: 'Complete 100 tarefas', icon: 'crown', requirement: 100, type: 'milestone', xpReward: 200 },
  { name: 'Ritmo Forte', description: 'Complete 5 tarefas em um dia', icon: 'zap', requirement: 5, type: 'daily', xpReward: 25 },
  { name: 'Constância de Ferro', description: 'Complete tarefas por 7 dias consecutivos', icon: 'flame', requirement: 7, type: 'daily', xpReward: 50 },
  { name: 'Precisão Máxima', description: 'Complete 20 tarefas sem atraso', icon: 'target', requirement: 20, type: 'weekly', xpReward: 75 },
];

export const seedAchievements = async () => {
  for (const achievement of defaultAchievements) {
    // Check if exists first
    const existing = await prisma.achievement.findFirst({
      where: { name: achievement.name }
    });
    
    if (!existing) {
      await prisma.achievement.create({
        data: achievement
      });
    }
  }
};

export const getAchievements = async (req: Request, res: Response) => {
  try {
    // Seed conquistas se não existirem
    await seedAchievements();

    const authReq = req as AuthRequest;
    
    const achievements = await prisma.achievement.findMany();
    
    // Buscar conquistas do usuário
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId: authReq.userId }
    });

    const achievedIds = new Set(userAchievements.map(ua => ua.achievementId));

    // Retornar conquistas com status
    const achievementsWithStatus = achievements.map(a => ({
      ...a,
      achieved: achievedIds.has(a.id),
      achievedAt: userAchievements.find(ua => ua.achievementId === a.id)?.achievedAt
    }));

    res.json(achievementsWithStatus);
  } catch (error) {
    console.error('Erro ao buscar conquistas:', error);
    res.status(500).json({ error: 'Erro ao buscar conquistas' });
  }
};

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const { sector } = req.query;

    const where: any = {};
    if (sector) where.sector = sector as string;

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        sector: true,
        level: true,
        xp: true,
        avatar: true
      },
      orderBy: { xp: 'desc' },
      take: 20
    });

    // Adicionar ranking
    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      ...user
    }));

    res.json(leaderboard);
  } catch (error) {
    console.error('Erro ao buscar leaderboard:', error);
    res.status(500).json({ error: 'Erro ao buscar ranking' });
  }
};

export const createAchievement = async (req: Request, res: Response) => {
  try {
    const { name, description, icon, requirement, type, xpReward } = req.body;
    const achievement = await prisma.achievement.create({
      data: { name, description, icon, requirement: Number(requirement), type, xpReward: Number(xpReward ?? 0) },
    });
    res.status(201).json(achievement);
  } catch (error) {
    console.error('Erro ao criar conquista:', error);
    res.status(500).json({ error: 'Erro ao criar conquista' });
  }
};

export const updateAchievement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, icon, requirement, type, xpReward } = req.body;
    const achievement = await prisma.achievement.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(requirement !== undefined && { requirement: Number(requirement) }),
        ...(type !== undefined && { type }),
        ...(xpReward !== undefined && { xpReward: Number(xpReward) }),
      },
    });
    res.json(achievement);
  } catch (error) {
    console.error('Erro ao atualizar conquista:', error);
    res.status(500).json({ error: 'Erro ao atualizar conquista' });
  }
};

export const deleteAchievement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.achievement.delete({ where: { id } });
    res.json({ message: 'Conquista removida' });
  } catch (error) {
    console.error('Erro ao deletar conquista:', error);
    res.status(500).json({ error: 'Erro ao deletar conquista' });
  }
};

// Verificar e atribuir conquistas após completar tarefa
export const checkAchievements = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return [];

    const completedAssignments = await prisma.taskAssignment.count({
      where: { userId, status: 'completed' },
    });
    const completedCount = completedAssignments;
    
    // Buscar conquistas não alcançadas
    const achievements = await prisma.achievement.findMany();
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId }
    });
    const achievedIds = new Set(userAchievements.map(ua => ua.achievementId));

    const newAchievements: string[] = [];

    for (const achievement of achievements) {
      if (achievedIds.has(achievement.id)) continue;

      let unlocked = false;

      switch (achievement.name) {
        case 'Primeira Tarefa':
          unlocked = completedCount >= 1;
          break;
        case 'Dez Tarefas':
          unlocked = completedCount >= 10;
          break;
        case 'Cinquenta Tarefas':
          unlocked = completedCount >= 50;
          break;
        case 'Cem Tarefas':
          unlocked = completedCount >= 100;
          break;
        // Adicionar mais lógica conforme necessário
      }

      if (unlocked) {
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id
          }
        });

        // Adicionar XP da conquista
        if (achievement.xpReward > 0) {
          await prisma.user.update({
            where: { id: userId },
            data: { xp: { increment: achievement.xpReward } }
          });
        }

        newAchievements.push(achievement.name);
      }
    }

    return newAchievements;
  } catch (error) {
    console.error('Erro ao verificar conquistas:', error);
    return [];
  }
};