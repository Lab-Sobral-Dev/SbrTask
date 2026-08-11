import { Prisma, PrismaClient } from '@prisma/client';
import prisma from '../config/prisma';
import { getIo } from '../socket';

// Aceita tanto o client top-level quanto um client de dentro de prisma.$transaction(),
// para permitir que chamadores componham awardXp() numa transação atômica maior
// (ex.: taskController#approveTask) sem duplicar a lógica de crédito de XP.
type Db = PrismaClient | Prisma.TransactionClient;

const xpForLevel = (level: number) => Math.floor(100 * Math.pow(level, 1.5));

function calcLevel(totalXp: number): number {
  let level = 1;
  let accumulated = 0;
  while (true) {
    accumulated += xpForLevel(level);
    if (totalXp < accumulated) break;
    level++;
  }
  return level;
}

export async function awardXp(
  params: {
    userId: string;
    amount: number;
    reason: string;
    category: string;
    refId?: string;
  },
  db: Db = prisma,
): Promise<{ xp: number; level: number }> {
  const { userId, amount, reason, category, refId } = params;

  await db.xpTransaction.create({
    data: { userId, amount, reason, category, refId },
  });

  const profile = await db.userGameProfile.upsert({
    where: { userId },
    create: { userId, xp: amount, level: calcLevel(amount) },
    update: { xp: { increment: amount } },
  });

  const newXp = profile.xp;
  const newLevel = calcLevel(newXp);

  if (newLevel !== profile.level) {
    await db.userGameProfile.update({
      where: { userId },
      data: { level: newLevel },
    });
  }

  try {
    getIo().to(`user-${userId}`).emit('xp_update', { xp: newXp, level: newLevel });
  } catch {
    // socket may not be initialised in tests
  }

  return { xp: newXp, level: newLevel };
}

export async function xpTodayByCategory(userId: string, category: string): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const result = await prisma.xpTransaction.aggregate({
    where: { userId, category, createdAt: { gte: start } },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}
