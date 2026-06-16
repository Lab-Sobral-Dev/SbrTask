import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/prisma';
import { awardXp, xpTodayByCategory } from '../services/xp';
import { sendTelegramMessage } from '../services/telegram';
import config from '../config';

const CONVENTIONAL_RE = /^(feat|fix|docs|style|refactor|test|chore|build|ci|perf|revert)(\(.+\))?!?: .+/;
const BRANCH_RE = /^(feat|fix|docs|style|refactor|test|chore|build|ci|perf|revert)\/.+/;

function verifySignature(body: Buffer, signature: string): boolean {
  if (!config.githubWebhookSecret) return false;
  const expected = 'sha256=' + crypto
    .createHmac('sha256', config.githubWebhookSecret)
    .update(body)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

async function notifyXp(userId: string, amount: number, reason: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { telegramChatId: true, name: true, gameProfile: { select: { xp: true, level: true } } } });
  if (!user?.telegramChatId) return;
  const xp = user.gameProfile?.xp ?? 0;
  const level = user.gameProfile?.level ?? 1;
  const text = `⚡ <b>+${amount} XP</b> — ${reason}\nTotal: ${xp} XP · Nível ${level}`;
  await sendTelegramMessage(user.telegramChatId, text);
}

async function findUser(email?: string, login?: string) {
  if (email) {
    const u = await prisma.user.findFirst({ where: { email } });
    if (u) return u;
  }
  if (login) {
    // convention: github login == adUsername
    return prisma.user.findFirst({ where: { adUsername: login } });
  }
  return null;
}

export const handleGithubWebhook = async (req: Request & { rawBody?: Buffer }, res: Response): Promise<void> => {
  const sig = req.headers['x-hub-signature-256'] as string | undefined;
  const deliveryId = req.headers['x-github-delivery'] as string | undefined;
  const event = req.headers['x-github-event'] as string | undefined;

  if (!sig || !deliveryId || !event) {
    res.status(400).json({ error: 'Missing GitHub headers' });
    return;
  }

  if (!config.githubWebhookSecret) {
    res.status(503).json({ error: 'Webhook secret not configured' });
    return;
  }
  const raw = req.rawBody;
  if (!raw || !verifySignature(raw, sig)) {
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  // dedup
  const existing = await prisma.gitHubEvent.findUnique({ where: { deliveryId } });
  if (existing) {
    res.json({ ok: true, duplicate: true });
    return;
  }

  const payload = req.body;

  try {
    if (event === 'push') {
      await handlePush(deliveryId, payload);
    } else if (event === 'pull_request') {
      await handlePullRequest(deliveryId, payload);
    } else if (event === 'issues') {
      await handleIssues(deliveryId, payload);
    } else {
      // unhandled event — just ack
    }
  } catch (err) {
    console.error('[github-webhook]', err);
    res.status(500).json({ error: 'Processing error' });
    return;
  }

  res.json({ ok: true });
};

async function handlePush(deliveryId: string, payload: any) {
  const pusherEmail: string | undefined = payload.pusher?.email;
  const senderLogin: string | undefined = payload.sender?.login;
  const ref: string = payload.ref ?? '';
  const repoName: string = payload.repository?.full_name ?? '';

  const user = await findUser(pusherEmail, senderLogin);
  if (!user) return;

  // new branch detection (before = all zeros)
  const isNewBranch = payload.before === '0000000000000000000000000000000000000000';
  const branchName = ref.replace('refs/heads/', '');

  if (isNewBranch) {
    const xpAmount = BRANCH_RE.test(branchName) ? 5 : 0;
    await prisma.gitHubEvent.create({
      data: {
        userId: user.id, deliveryId,
        eventType: 'push', action: 'branch_created',
        repoName, refName: branchName,
        hasDiff: false, xpAwarded: xpAmount,
      },
    });
    if (xpAmount > 0) {
      await awardXp({ userId: user.id, amount: xpAmount, reason: `Branch criada: ${branchName}`, category: 'github', refId: deliveryId });
      await notifyXp(user.id, xpAmount, `Branch criada: ${branchName}`);
    }
    return;
  }

  // process commits
  const commits: any[] = payload.commits ?? [];
  const DAILY_CAP = 50;
  const alreadyToday = await xpTodayByCategory(user.id, 'github');
  let remaining = Math.max(0, DAILY_CAP - alreadyToday);

  for (const commit of commits) {
    const hasDiff = (commit.added?.length + commit.removed?.length + commit.modified?.length) > 0;
    const isConventional = CONVENTIONAL_RE.test(commit.message ?? '');
    const xpAmount = (hasDiff && isConventional && remaining > 0) ? Math.min(10, remaining) : 0;
    remaining -= xpAmount;

    await prisma.gitHubEvent.create({
      data: {
        userId: user.id, deliveryId: `${deliveryId}-${commit.id}`,
        eventType: 'push', action: 'commit',
        repoName, refName: branchName, commitSha: commit.id,
        hasDiff, xpAwarded: xpAmount,
      },
    }).catch(() => {}); // ignore unique violations on re-delivery

    if (xpAmount > 0) {
      const commitReason = `Commit: ${String(commit.message).slice(0, 72)}`;
      await awardXp({ userId: user.id, amount: xpAmount, reason: commitReason, category: 'github', refId: commit.id });
      await notifyXp(user.id, xpAmount, commitReason);
    }
  }
}

async function handlePullRequest(deliveryId: string, payload: any) {
  const action: string = payload.action ?? '';
  const pr = payload.pull_request;
  const senderLogin: string | undefined = payload.sender?.login;
  const repoName: string = payload.repository?.full_name ?? '';

  const user = await findUser(pr?.user?.email, senderLogin);
  if (!user) return;

  let xpAmount = 0;
  let reason = '';

  if (action === 'opened' && pr?.body) {
    xpAmount = 20;
    reason = `PR aberto: ${String(pr.title).slice(0, 72)}`;
  } else if (action === 'closed' && pr?.merged) {
    xpAmount = 30;
    reason = `PR mergeado: ${String(pr.title).slice(0, 72)}`;
  }

  await prisma.gitHubEvent.create({
    data: {
      userId: user.id, deliveryId,
      eventType: 'pull_request', action,
      repoName, xpAwarded: xpAmount,
    },
  });

  if (xpAmount > 0) {
    await awardXp({ userId: user.id, amount: xpAmount, reason, category: 'github', refId: deliveryId });
    await notifyXp(user.id, xpAmount, reason);
  }
}

async function handleIssues(deliveryId: string, payload: any) {
  const action: string = payload.action ?? '';
  if (action !== 'closed') return;

  const senderLogin: string | undefined = payload.sender?.login;
  const repoName: string = payload.repository?.full_name ?? '';
  const issue = payload.issue;

  const user = await findUser(undefined, senderLogin);
  if (!user) return;

  await prisma.gitHubEvent.create({
    data: {
      userId: user.id, deliveryId,
      eventType: 'issues', action,
      repoName, xpAwarded: 25,
    },
  });

  const issueReason = `Issue fechada: #${issue?.number}`;
  await awardXp({ userId: user.id, amount: 25, reason: issueReason, category: 'github', refId: deliveryId });
  await notifyXp(user.id, 25, issueReason);
}
