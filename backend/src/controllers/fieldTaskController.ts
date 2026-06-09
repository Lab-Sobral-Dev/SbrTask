import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { awardXp } from '../services/xp';
import { AuthRequest } from '../middlewares/auth';

function calcSlaStatus(durationMin: number, slaMinutes: number): string {
  const ratio = durationMin / slaMinutes;
  if (ratio <= 1.0) return 'within';
  if (ratio <= 1.2) return 'over_20';
  if (ratio <= 1.5) return 'over_50';
  return 'exceeded';
}

function calcXpBySla(xpBase: number, slaStatus: string): number {
  if (slaStatus === 'within') return xpBase;
  if (slaStatus === 'over_20') return Math.floor(xpBase * 0.7);
  if (slaStatus === 'over_50') return Math.floor(xpBase * 0.4);
  return 0;
}

const createSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  category: z.string().min(1),
  xpBase: z.number().int().positive(),
  slaMinutes: z.number().int().positive(),
});

const stopSchema = z.object({
  glpiTicketId: z.string().optional(),
});

export const listFieldTasks = async (_req: AuthRequest, res: Response): Promise<void> => {
  const tasks = await prisma.fieldTask.findMany({
    where: { active: true },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });
  res.json(tasks);
};

export const createFieldTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const task = await prisma.fieldTask.create({ data: parsed.data });
  res.status(201).json(task);
};

export const updateFieldTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const parsed = createSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const task = await prisma.fieldTask.update({ where: { id }, data: parsed.data });
  res.json(task);
};

export const startFieldTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { id: fieldTaskId } = req.params;

  const task = await prisma.fieldTask.findUnique({ where: { id: fieldTaskId } });
  if (!task || !task.active) {
    res.status(404).json({ error: 'Tarefa não encontrada' });
    return;
  }

  // only one active session per user at a time
  const active = await prisma.fieldTaskSession.findFirst({
    where: { userId, stoppedAt: null },
  });
  if (active) {
    res.status(409).json({ error: 'Você já tem uma tarefa em andamento', sessionId: active.id });
    return;
  }

  const session = await prisma.fieldTaskSession.create({
    data: { userId, fieldTaskId },
    include: { fieldTask: true },
  });
  res.status(201).json(session);
};

export const stopFieldTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { id: fieldTaskId } = req.params;
  const parsed = stopSchema.safeParse(req.body);
  const glpiTicketId = parsed.success ? parsed.data.glpiTicketId : undefined;

  const session = await prisma.fieldTaskSession.findFirst({
    where: { userId, fieldTaskId, stoppedAt: null },
    include: { fieldTask: true },
  });
  if (!session) {
    res.status(404).json({ error: 'Nenhuma sessão ativa para esta tarefa' });
    return;
  }

  const stoppedAt = new Date();
  const durationMin = Math.ceil((stoppedAt.getTime() - session.startedAt.getTime()) / 60000);
  const slaStatus = calcSlaStatus(durationMin, session.fieldTask.slaMinutes);
  const xpAwarded = calcXpBySla(session.fieldTask.xpBase, slaStatus);

  const updated = await prisma.fieldTaskSession.update({
    where: { id: session.id },
    data: { stoppedAt, durationMin, slaStatus, xpAwarded, glpiTicketId: glpiTicketId ?? null },
    include: { fieldTask: true },
  });

  if (xpAwarded > 0) {
    await awardXp({
      userId,
      amount: xpAwarded,
      reason: `Tarefa de campo: ${session.fieldTask.name} (${slaStatus})`,
      category: 'field_task',
      refId: session.id,
    });
  }

  res.json({ session: updated, xpAwarded, slaStatus, durationMin });
};
