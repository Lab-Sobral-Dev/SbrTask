import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middlewares/auth';
import { getIo } from '../socket';
import { checkAchievements } from './achievementController';

const assignmentInclude = {
  user: { select: { id: true, name: true, sector: true } },
};

const taskInclude = {
  creator: { select: { id: true, name: true } },
  assignments: { include: assignmentInclude },
};

const sendNotification = async (
  userId: string,
  type: string,
  message: string,
  taskId: string,
) => {
  const notification = await prisma.notification.create({
    data: { userId, type, message, taskId },
  });
  try {
    getIo().to(`user-${userId}`).emit('notification', {
      id: notification.id,
      type,
      message,
      taskId,
      createdAt: notification.createdAt,
    });
  } catch {
    // Socket.io not yet initialised in test env — safe to ignore
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { title, description, priority, dueDate, category, xpReward, assigneeIds } =
      req.body as {
        title: string;
        description?: string;
        priority?: string;
        dueDate?: string;
        category?: string;
        xpReward: number;
        assigneeIds: string[];
      };

    if (!Array.isArray(assigneeIds) || assigneeIds.length === 0) {
      return res.status(400).json({ error: 'assigneeIds deve ser um array não vazio' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority ?? 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        category,
        xpReward,
        createdBy: authReq.userId!,
        assignments: {
          create: assigneeIds.map((uid) => ({ userId: uid })),
        },
      },
      include: taskInclude,
    });

    for (const uid of assigneeIds) {
      await sendNotification(uid, 'task_assigned', `Nova tarefa atribuída: ${title}`, task.id);
    }

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

    const user = await prisma.user.findUnique({ where: { id: authReq.userId! } });
    const isAdmin = user?.role === 'admin';

    const where: Record<string, unknown> = {};
    if (status && status !== 'all') where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;

    if (!isAdmin) {
      where.assignments = { some: { userId: authReq.userId! } };
    }

    const taskList = await prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: { createdAt: 'desc' },
    });

    res.json(taskList);
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error);
    res.status(500).json({ error: 'Erro ao buscar tarefas' });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;

    const assignments = await prisma.taskAssignment.findMany({
      where: { userId: authReq.userId! },
      include: { task: true },
    });

    const completedAssignments = assignments.filter((a) => a.status === 'completed');
    const pendingAssignments = assignments.filter((a) => a.status === 'pending');
    const inProgressAssignments = assignments.filter((a) => a.status === 'in_progress');

    const byPriority = {
      simple: completedAssignments.filter((a) => a.task.priority === 'simple').length,
      medium: completedAssignments.filter((a) => a.task.priority === 'medium').length,
      critical: completedAssignments.filter((a) => a.task.priority === 'critical').length,
    };

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCompleted = completedAssignments.filter(
      (a) => a.completedAt && new Date(a.completedAt) > sevenDaysAgo,
    ).length;

    const totalXPFromTasks = completedAssignments.reduce(
      (acc, a) => acc + a.task.xpReward,
      0,
    );

    res.json({
      total: assignments.length,
      completed: completedAssignments.length,
      pending: pendingAssignments.length,
      inProgress: inProgressAssignments.length,
      byPriority,
      recentCompleted,
      totalXPFromTasks,
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};

export const getTaskById = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const id = req.params.id as string;

    const user = await prisma.user.findUnique({ where: { id: authReq.userId! } });
    const isAdmin = user?.role === 'admin';

    const task = await prisma.task.findFirst({
      where: isAdmin
        ? { id }
        : { id, assignments: { some: { userId: authReq.userId! } } },
      include: taskInclude,
    });

    if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });
    res.json(task);
  } catch (error) {
    console.error('Erro ao buscar tarefa:', error);
    res.status(500).json({ error: 'Erro ao buscar tarefa' });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { title, description, priority, dueDate, category, xpReward } = req.body;

    const existing = await prisma.task.findUnique({
      where: { id },
      include: { assignments: { select: { userId: true } } },
    });
    if (!existing) return res.status(404).json({ error: 'Tarefa não encontrada' });

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(category !== undefined && { category }),
        ...(xpReward !== undefined && { xpReward }),
      },
      include: taskInclude,
    });

    for (const { userId } of existing.assignments) {
      await sendNotification(userId, 'task_updated', `Tarefa atualizada: ${task.title}`, id);
    }

    res.json(task);
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    res.status(500).json({ error: 'Erro ao atualizar tarefa' });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Tarefa não encontrada' });

    await prisma.task.delete({ where: { id } });
    res.json({ message: 'Tarefa deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar tarefa:', error);
    res.status(500).json({ error: 'Erro ao deletar tarefa' });
  }
};

// XP needed to go from level N to N+1: floor(100 * N^1.5)
// Cumulative XP to reach level N: sum of xpForLevel(1..N-1)
const xpForLevel = (level: number): number => Math.floor(100 * Math.pow(level, 1.5));

const calculateLevel = (xp: number): number => {
  let level = 1;
  let cumulative = 0;
  while (cumulative + xpForLevel(level) <= xp) {
    cumulative += xpForLevel(level);
    level++;
  }
  return level;
};

// PATCH /tasks/:id/assignment — usuário atualiza seu próprio progresso
// 'completed' pelo usuário move para 'pending_review'; XP só é creditado pelo admin
export const updateAssignment = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId!;
    const taskId = req.params.id as string;
    const { status } = req.body as { status: string };

    const userAllowedStatuses = ['pending', 'in_progress', 'pending_review'];
    if (!userAllowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status inválido. Use pending, in_progress ou pending_review' });
    }

    const assignment = await prisma.taskAssignment.findUnique({
      where: { taskId_userId: { taskId, userId } },
    });
    if (!assignment) return res.status(404).json({ error: 'Assignment não encontrado' });

    if (assignment.status === 'completed') {
      return res.status(400).json({ error: 'Assignment já foi aprovado pelo admin' });
    }

    const updated = await prisma.taskAssignment.update({
      where: { taskId_userId: { taskId, userId } },
      data: { status },
    });

    // Notificar o criador da tarefa (admin) que o usuário sinalizou conclusão
    if (status === 'pending_review') {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      const requester = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      if (task) {
        await sendNotification(
          task.createdBy,
          'pending_review',
          `${requester?.name ?? 'Usuário'} concluiu "${task.title}" — aguardando aprovação`,
          taskId,
        );
      }
    }

    res.json({ assignment: updated });
  } catch (error) {
    console.error('Erro ao atualizar assignment:', error);
    res.status(500).json({ error: 'Erro ao atualizar assignment' });
  }
};

// PATCH /tasks/:id/assignment/:userId/approve — admin aprova e credita XP
export const approveAssignment = async (req: Request, res: Response) => {
  try {
    const taskId = req.params.id as string;
    const targetUserId = req.params.userId as string;

    const assignment = await prisma.taskAssignment.findUnique({
      where: { taskId_userId: { taskId, userId: targetUserId } },
    });
    if (!assignment) return res.status(404).json({ error: 'Assignment não encontrado' });

    if (assignment.status !== 'pending_review') {
      return res.status(400).json({ error: 'Assignment não está pendente de revisão' });
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });

    // Marcar assignment como concluído
    const updated = await prisma.taskAssignment.update({
      where: { taskId_userId: { taskId, userId: targetUserId } },
      data: { status: 'completed', completedAt: new Date() },
    });

    // Creditar XP ao usuário aprovado
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { xp: { increment: task.xpReward } },
    });
    const newLevel = calculateLevel(updatedUser.xp);
    if (newLevel !== updatedUser.level) {
      await prisma.user.update({ where: { id: targetUserId }, data: { level: newLevel } });
    }

    // Empurrar XP/level atualizados para o frontend do usuário via socket
    try {
      getIo().to(`user-${targetUserId}`).emit('xp_update', {
        xp: updatedUser.xp,
        level: newLevel,
      });
    } catch (_) {}

    // Notificar usuário que foi aprovado
    await sendNotification(
      targetUserId,
      'assignment_approved',
      `Sua conclusão de "${task.title}" foi aprovada! +${task.xpReward} XP`,
      taskId,
    );

    await checkAchievements(targetUserId);

    // Se todos os assignments estiverem concluídos, fechar a task
    const allAssignments = await prisma.taskAssignment.findMany({ where: { taskId } });
    const allDone = allAssignments.every((a) => a.status === 'completed');
    if (allDone) {
      await prisma.task.update({ where: { id: taskId }, data: { status: 'completed' } });
    }

    res.json({ assignment: updated, taskCompleted: allDone, xpAwarded: task.xpReward });
  } catch (error) {
    console.error('Erro ao aprovar assignment:', error);
    res.status(500).json({ error: 'Erro ao aprovar assignment' });
  }
};
