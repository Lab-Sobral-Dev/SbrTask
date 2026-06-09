import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import prisma from '../config/prisma';
import config from '../config';
import { AuthRequest } from '../middlewares/auth';
import { getIo } from '../socket';

function periodLabel(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function periodRange(period: string): { start: Date; end: Date } {
  const [y, m] = period.split('-').map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);
  return { start, end };
}

async function getTierConfig(): Promise<Record<string, { minXp: number; maxXp: number | null; amount: number }>> {
  const configs = await prisma.commissionConfig.findMany();
  return Object.fromEntries(configs.map(c => [c.tier, { minXp: c.minXp, maxXp: c.maxXp, amount: Number(c.commissionAmt) }]));
}

function resolveTier(xp: number, tiers: ReturnType<typeof getTierConfig> extends Promise<infer T> ? T : never): string {
  const order = ['elite', 'platinum', 'gold', 'silver', 'bronze'];
  for (const tier of order) {
    const t = tiers[tier];
    if (!t) continue;
    if (xp >= t.minXp && (t.maxXp === null || xp <= t.maxXp)) return tier;
  }
  return 'bronze';
}

export const getCurrentCycle = async (req: AuthRequest, res: Response): Promise<void> => {
  const period = (req.query.period as string) ?? periodLabel(new Date());
  const { start, end } = periodRange(period);
  const tiers = await getTierConfig();

  const transactions = await prisma.xpTransaction.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: start, lt: end } },
    _sum: { amount: true },
  });

  const users = await prisma.user.findMany({
    where: { id: { in: transactions.map(t => t.userId) } },
    select: { id: true, name: true, adUsername: true, department: true },
  });

  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  const summary = transactions.map(t => {
    const xp = t._sum.amount ?? 0;
    const tier = resolveTier(xp, tiers);
    const commissionAmt = tiers[tier]?.amount ?? 0;
    return { user: userMap[t.userId], xp, tier, commissionAmt };
  }).sort((a, b) => b.xp - a.xp);

  res.json({ period, summary, tierConfig: tiers });
};

const closeCycleSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/),
});

export const closeCycle = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = closeCycleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { period } = parsed.data;
  const { start, end } = periodRange(period);
  const tiers = await getTierConfig();

  const transactions = await prisma.xpTransaction.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: start, lt: end } },
    _sum: { amount: true },
  });

  const cycles = await Promise.all(
    transactions.map(async t => {
      const xp = t._sum.amount ?? 0;
      const tier = resolveTier(xp, tiers);
      const commissionAmt = tiers[tier]?.amount ?? 0;

      return prisma.commissionCycle.upsert({
        where: { userId_period: { userId: t.userId, period } },
        create: { userId: t.userId, period, totalXp: xp, tier, commissionAmt },
        update: { totalXp: xp, tier, commissionAmt, sentToTheo: false },
      });
    })
  );

  // write entity-exchange envelope
  const technicians = await Promise.all(
    cycles.map(async c => {
      const user = await prisma.user.findUnique({ where: { id: c.userId }, select: { adUsername: true, name: true } });
      return { adUsername: user?.adUsername, name: user?.name, xp: c.totalXp, tier: c.tier, commissionAmt: Number(c.commissionAmt) };
    })
  );

  const envelope = {
    de: 'sbrtask',
    para: 'theo',
    tipo: 'comissionamento_ciclo',
    assunto: `Fechamento XP mensal equipe TI`,
    corpo: { periodo: period, tecnicos: technicians },
  };

  const exchangePath = config.entityExchangePath;
  if (exchangePath) {
    try {
      const uuid = crypto.randomUUID();
      fs.mkdirSync(path.join(exchangePath, 'msgs'), { recursive: true });
      fs.writeFileSync(path.join(exchangePath, 'msgs', `${uuid}.json`), JSON.stringify(envelope, null, 2));
      await prisma.commissionCycle.updateMany({ where: { period }, data: { sentToTheo: true } });
    } catch (err) {
      console.error('[commission] entity-exchange write failed:', err);
    }
  }

  try {
    getIo().emit('commission_cycle', { period, count: cycles.length });
  } catch { /* socket not ready */ }

  res.json({ period, closed: cycles.length, envelope });
};

const upsertConfigSchema = z.object({
  tier: z.enum(['bronze', 'silver', 'gold', 'platinum', 'elite']),
  minXp: z.number().int().min(0),
  maxXp: z.number().int().positive().nullable(),
  amount: z.number().min(0),
});

export const upsertCommissionConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = upsertConfigSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { tier, minXp, maxXp, amount } = parsed.data;
  const cfg = await prisma.commissionConfig.upsert({
    where: { tier },
    create: { tier, minXp, maxXp, amount },
    update: { minXp, maxXp, amount },
  });
  res.json(cfg);
};

export const listCommissionConfig = async (_req: AuthRequest, res: Response): Promise<void> => {
  const configs = await prisma.commissionConfig.findMany({ orderBy: { minXp: 'asc' } });
  res.json(configs);
};
