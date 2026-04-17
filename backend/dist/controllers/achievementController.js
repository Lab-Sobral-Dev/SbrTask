"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAchievements = exports.getLeaderboard = exports.getAchievements = exports.seedAchievements = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
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
const seedAchievements = async () => {
    for (const achievement of defaultAchievements) {
        // Check if exists first
        const existing = await prisma_1.default.achievement.findFirst({
            where: { name: achievement.name }
        });
        if (!existing) {
            await prisma_1.default.achievement.create({
                data: achievement
            });
        }
    }
};
exports.seedAchievements = seedAchievements;
const getAchievements = async (req, res) => {
    try {
        // Seed conquistas se não existirem
        await (0, exports.seedAchievements)();
        const authReq = req;
        const achievements = await prisma_1.default.achievement.findMany();
        // Buscar conquistas do usuário
        const userAchievements = await prisma_1.default.userAchievement.findMany({
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
    }
    catch (error) {
        console.error('Erro ao buscar conquistas:', error);
        res.status(500).json({ error: 'Erro ao buscar conquistas' });
    }
};
exports.getAchievements = getAchievements;
const getLeaderboard = async (req, res) => {
    try {
        const { sector } = req.query;
        const where = {};
        if (sector)
            where.sector = sector;
        const users = await prisma_1.default.user.findMany({
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
    }
    catch (error) {
        console.error('Erro ao buscar leaderboard:', error);
        res.status(500).json({ error: 'Erro ao buscar ranking' });
    }
};
exports.getLeaderboard = getLeaderboard;
// Verificar e atribuir conquistas após completar tarefa
const checkAchievements = async (userId) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: { tasks: { where: { status: 'completed' } } }
        });
        if (!user)
            return [];
        const completedCount = user.tasks.length;
        // Buscar conquistas não alcançadas
        const achievements = await prisma_1.default.achievement.findMany();
        const userAchievements = await prisma_1.default.userAchievement.findMany({
            where: { userId }
        });
        const achievedIds = new Set(userAchievements.map(ua => ua.achievementId));
        const newAchievements = [];
        for (const achievement of achievements) {
            if (achievedIds.has(achievement.id))
                continue;
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
                await prisma_1.default.userAchievement.create({
                    data: {
                        userId,
                        achievementId: achievement.id
                    }
                });
                // Adicionar XP da conquista
                if (achievement.xpReward > 0) {
                    await prisma_1.default.user.update({
                        where: { id: userId },
                        data: { xp: { increment: achievement.xpReward } }
                    });
                }
                newAchievements.push(achievement.name);
            }
        }
        return newAchievements;
    }
    catch (error) {
        console.error('Erro ao verificar conquistas:', error);
        return [];
    }
};
exports.checkAchievements = checkAchievements;
//# sourceMappingURL=achievementController.js.map