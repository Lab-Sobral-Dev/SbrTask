import prisma from '../config/prisma';
import { getIo } from '../socket';

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

export async function awardXp(params: {
  userId: string;
  amount: number;
  reason: string;
  category: string;
  refId?: string;
}): Promise<{ xp: number; level: number }> {
  const { userId, amount, reason, category, refId } = params;

  await prisma.xpTransaction.create({
    data: { userId, amount, reason, category, refId },
  });

  const profile = await prisma.userGameProfile.upsert({
    where: { userId },
    create: { userId, xp: amount, level: calcLevel(amount) },
    update: { xp: { increment: amount } },
  });

  const newXp = profile.xp;
  const newLevel = calcLevel(newXp);

  if (newLevel !== profile.level) {
    await prisma.userGameProfile.update({
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
