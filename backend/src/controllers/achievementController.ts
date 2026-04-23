import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middlewares/auth';

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
    const existing = await prisma.achievement.findFirst({ where: { name: achievement.name } });
    if (!existing) await prisma.achievement.create({ data: achievement });
  }
};

export const getAchievements = async (req: Request, res: Response) => {
  try {
    await seedAchievements();
    const authReq = req as AuthRequest;
    const achievements = await prisma.achievement.findMany();
    const userAchievements = await prisma.userAchievement.findMany({ where: { userId: authReq.userId } });
    const achievedIds = new Set(userAchievements.map((ua) => ua.achievementId));
    const result = achievements.map((a) => ({
      ...a,
      achieved: achievedIds.has(a.id),
      achievedAt: userAchievements.find((ua) => ua.achievementId === a.id)?.achievedAt,
    }));
    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar conquistas:', error);
    res.status(500).json({ error: 'Erro ao buscar conquistas' });
  }
};

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const { sector: department, period } = req.query;

    if (!period || period === 'all') {
      const profiles = await prisma.userGameProfile.findMany({
        include: {
          user: { select: { id: true, name: true, department: true } },
        },
        where: department ? { user: { department: department as string } } : undefined,
        orderBy: { xp: 'desc' },
        take: 20,
      });
      return res.json(
        profiles.map((p, i) => ({
          rank: i + 1,
          id: p.user.id,
          name: p.user.name,
          department: p.user.department,
          xp: p.xp,
        })),
      );
    }

    const now = new Date();
    let periodStart: Date;
    if (period === 'today') {
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'week') {
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - 30);
    } else {
      return res.status(400).json({ error: 'period inválido. Use: today, week, month, all' });
    }

    const assignments = await prisma.taskAssignment.findMany({
      where: {
        status: 'completed',
        completedAt: { gte: periodStart },
        ...(department ? { user: { department: department as string } } : {}),
      },
      include: {
        task: { select: { xpReward: true } },
        user: { select: { id: true, name: true, department: true } },
      },
    });

    const xpByUser = new Map<string, { xp: number; user: typeof assignments[0]['user'] }>();
    for (const a of assignments) {
      if (!xpByUser.has(a.userId)) xpByUser.set(a.userId, { xp: 0, user: a.user });
      xpByUser.get(a.userId)!.xp += a.task.xpReward;
    }

    const leaderboard = Array.from(xpByUser.values())
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 20)
      .map(({ xp, user }, index) => ({ rank: index + 1, ...user, xp }));

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
    const id = req.params.id as string;
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
    const id = req.params.id as string;
    await prisma.achievement.delete({ where: { id } });
    res.json({ message: 'Conquista removida' });
  } catch (error) {
    console.error('Erro ao deletar conquista:', error);
    res.status(500).json({ error: 'Erro ao deletar conquista' });
  }
};

export const checkAchievements = async (userId: string) => {
  try {
    const completedCount = await prisma.taskAssignment.count({ where: { userId, status: 'completed' } });
    const achievements = await prisma.achievement.findMany();
    const userAchievements = await prisma.userAchievement.findMany({ where: { userId } });
    const achievedIds = new Set(userAchievements.map((ua) => ua.achievementId));
    const newAchievements: string[] = [];

    for (const achievement of achievements) {
      if (achievedIds.has(achievement.id)) continue;
      let unlocked = false;
      switch (achievement.name) {
        case 'Primeira Tarefa':   unlocked = completedCount >= 1;   break;
        case 'Dez Tarefas':      unlocked = completedCount >= 10;  break;
        case 'Cinquenta Tarefas': unlocked = completedCount >= 50;  break;
        case 'Cem Tarefas':      unlocked = completedCount >= 100; break;
      }
      if (!unlocked) continue;

      await prisma.userAchievement.create({ data: { userId, achievementId: achievement.id } });

      if (achievement.xpReward > 0) {
        await prisma.userGameProfile.upsert({
          where: { userId },
          update: { xp: { increment: achievement.xpReward } },
          create: { userId, xp: achievement.xpReward, level: 1 },
        });
      }

      newAchievements.push(achievement.name);
    }

    return newAchievements;
  } catch (error) {
    console.error('Erro ao verificar conquistas:', error);
    return [];
  }
};
