import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middlewares/auth';

interface TaskBody {
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  dueDate?: string;
  category?: string;
  xpReward?: number;
}

// Helper to get string id from params
const getIdParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0];
  return param || '';
};

//XP reward based on priority
const getXPReward = (priority: string, baseXP: number = 10): number => {
  switch (priority) {
    case 'simple':
      return baseXP;
    case 'medium':
      return 25;
    case 'critical':
      return 50;
    default:
      return baseXP;
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { title, description, priority, dueDate, category, xpReward } = req.body as TaskBody;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        category,
        xpReward: xpReward || getXPReward(priority || 'medium'),
        userId: authReq.userId!
      }
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    res.status(500).json({ error: 'Erro ao criar tarefa' });
  }
};

export const getTasks = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { status, priority, category } = req.query;

    const where: any = { userId: authReq.userId };
    
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json(tasks);
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error);
    res.status(500).json({ error: 'Erro ao buscar tarefas' });
  }
};

export const getTaskById = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const id = getIdParam(req.params.id);

    const task = await prisma.task.findFirst({
      where: { id, userId: authReq.userId }
    });

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    res.json(task);
  } catch (error) {
    console.error('Erro ao buscar tarefa:', error);
    res.status(500).json({ error: 'Erro ao buscar tarefa' });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const id = getIdParam(req.params.id);
    const { title, description, priority, status, dueDate, category, xpReward } = req.body as TaskBody;

    // Verificar se a tarefa pertence ao usuário
    const existingTask = await prisma.task.findFirst({
      where: { id, userId: authReq.userId }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(priority && { priority }),
        ...(status && { status }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(category && { category }),
        ...(xpReward && { xpReward })
      }
    });

    res.json(task);
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    res.status(500).json({ error: 'Erro ao atualizar tarefa' });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const id = getIdParam(req.params.id);

    // Verificar se a tarefa pertence ao usuário
    const existingTask = await prisma.task.findFirst({
      where: { id, userId: authReq.userId }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    await prisma.task.delete({ where: { id } });

    res.json({ message: 'Tarefa deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar tarefa:', error);
    res.status(500).json({ error: 'Erro ao deletar tarefa' });
  }
};

export const completeTask = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const id = getIdParam(req.params.id);

    // Buscar tarefa
    const task = await prisma.task.findFirst({
      where: { id, userId: authReq.userId }
    });

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    if (task.status === 'completed') {
      return res.status(400).json({ error: 'Tarefa já foi concluída' });
    }

    // Calcular bônus de XP
    let xpEarned = task.xpReward;
    
    // Bônus por entrega antecipada
    if (task.dueDate && new Date() < new Date(task.dueDate)) {
      xpEarned += 10;
    }
    
    // Penalidade por atraso (menor XP)
    if (task.dueDate && new Date() > new Date(task.dueDate)) {
      xpEarned = Math.floor(xpEarned * 0.5);
    }

    // Atualizar tarefa
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date()
      }
    });

    // Adicionar XP ao usuário
    const user = await prisma.user.update({
      where: { id: authReq.userId },
      data: {
        xp: { increment: xpEarned }
      }
    });

    // Verificar se usuário subiu de nível
    const newLevel = calculateLevel(user.xp);
    let leveledUp = false;
    
    if (newLevel > user.level) {
      await prisma.user.update({
        where: { id: authReq.userId },
        data: { level: newLevel }
      });
      leveledUp = true;
    }

    res.json({
      task: updatedTask,
      xpEarned,
      totalXP: user.xp,
      level: leveledUp ? newLevel : user.level,
      leveledUp
    });
  } catch (error) {
    console.error('Erro ao completar tarefa:', error);
    res.status(500).json({ error: 'Erro ao completar tarefa' });
  }
};

// Função para calcular nível
const calculateLevel = (xp: number): number => {
  let level = 1;
  let totalXP = 0;
  
  while (true) {
    const xpNeeded = Math.floor(100 * Math.pow(level, 1.5));
    if (totalXP + xpNeeded > xp) {
      break;
    }
    totalXP += xpNeeded;
    level++;
  }
  
  return level;
};

// Estatísticas do usuário
export const getStats = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;

    const tasks = await prisma.task.findMany({
      where: { userId: authReq.userId }
    });

    const completedTasks = tasks.filter(t => t.status === 'completed');
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress');

    // Estatísticas por prioridade
    const byPriority = {
      simple: completedTasks.filter(t => t.priority === 'simple').length,
      medium: completedTasks.filter(t => t.priority === 'medium').length,
      critical: completedTasks.filter(t => t.priority === 'critical').length
    };

    // Tarefas concluídas nos últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCompleted = completedTasks.filter(t => 
      t.completedAt && new Date(t.completedAt) > sevenDaysAgo
    ).length;

    // XP total ganhos
    const totalXPFromTasks = completedTasks.reduce((acc, t) => acc + t.xpReward, 0);

    res.json({
      total: tasks.length,
      completed: completedTasks.length,
      pending: pendingTasks.length,
      inProgress: inProgressTasks.length,
      byPriority,
      recentCompleted,
      totalXPFromTasks
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};