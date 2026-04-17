"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStats = exports.completeTask = exports.deleteTask = exports.updateTask = exports.getTaskById = exports.getTasks = exports.createTask = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
// Helper to get string id from params
const getIdParam = (param) => {
    if (Array.isArray(param))
        return param[0];
    return param || '';
};
//XP reward based on priority
const getXPReward = (priority, baseXP = 10) => {
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
const createTask = async (req, res) => {
    try {
        const authReq = req;
        const { title, description, priority, dueDate, category, xpReward } = req.body;
        const task = await prisma_1.default.task.create({
            data: {
                title,
                description,
                priority: priority || 'medium',
                dueDate: dueDate ? new Date(dueDate) : null,
                category,
                xpReward: xpReward || getXPReward(priority || 'medium'),
                userId: authReq.userId
            }
        });
        res.status(201).json(task);
    }
    catch (error) {
        console.error('Erro ao criar tarefa:', error);
        res.status(500).json({ error: 'Erro ao criar tarefa' });
    }
};
exports.createTask = createTask;
const getTasks = async (req, res) => {
    try {
        const authReq = req;
        const { status, priority, category } = req.query;
        const where = { userId: authReq.userId };
        if (status)
            where.status = status;
        if (priority)
            where.priority = priority;
        if (category)
            where.category = category;
        const tasks = await prisma_1.default.task.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
        res.json(tasks);
    }
    catch (error) {
        console.error('Erro ao buscar tarefas:', error);
        res.status(500).json({ error: 'Erro ao buscar tarefas' });
    }
};
exports.getTasks = getTasks;
const getTaskById = async (req, res) => {
    try {
        const authReq = req;
        const id = getIdParam(req.params.id);
        const task = await prisma_1.default.task.findFirst({
            where: { id, userId: authReq.userId }
        });
        if (!task) {
            return res.status(404).json({ error: 'Tarefa não encontrada' });
        }
        res.json(task);
    }
    catch (error) {
        console.error('Erro ao buscar tarefa:', error);
        res.status(500).json({ error: 'Erro ao buscar tarefa' });
    }
};
exports.getTaskById = getTaskById;
const updateTask = async (req, res) => {
    try {
        const authReq = req;
        const id = getIdParam(req.params.id);
        const { title, description, priority, status, dueDate, category, xpReward } = req.body;
        // Verificar se a tarefa pertence ao usuário
        const existingTask = await prisma_1.default.task.findFirst({
            where: { id, userId: authReq.userId }
        });
        if (!existingTask) {
            return res.status(404).json({ error: 'Tarefa não encontrada' });
        }
        const task = await prisma_1.default.task.update({
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
    }
    catch (error) {
        console.error('Erro ao atualizar tarefa:', error);
        res.status(500).json({ error: 'Erro ao atualizar tarefa' });
    }
};
exports.updateTask = updateTask;
const deleteTask = async (req, res) => {
    try {
        const authReq = req;
        const id = getIdParam(req.params.id);
        // Verificar se a tarefa pertence ao usuário
        const existingTask = await prisma_1.default.task.findFirst({
            where: { id, userId: authReq.userId }
        });
        if (!existingTask) {
            return res.status(404).json({ error: 'Tarefa não encontrada' });
        }
        await prisma_1.default.task.delete({ where: { id } });
        res.json({ message: 'Tarefa deletada com sucesso' });
    }
    catch (error) {
        console.error('Erro ao deletar tarefa:', error);
        res.status(500).json({ error: 'Erro ao deletar tarefa' });
    }
};
exports.deleteTask = deleteTask;
const completeTask = async (req, res) => {
    try {
        const authReq = req;
        const id = getIdParam(req.params.id);
        // Buscar tarefa
        const task = await prisma_1.default.task.findFirst({
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
        const updatedTask = await prisma_1.default.task.update({
            where: { id },
            data: {
                status: 'completed',
                completedAt: new Date()
            }
        });
        // Adicionar XP ao usuário
        const user = await prisma_1.default.user.update({
            where: { id: authReq.userId },
            data: {
                xp: { increment: xpEarned }
            }
        });
        // Verificar se usuário subiu de nível
        const newLevel = calculateLevel(user.xp);
        let leveledUp = false;
        if (newLevel > user.level) {
            await prisma_1.default.user.update({
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
    }
    catch (error) {
        console.error('Erro ao completar tarefa:', error);
        res.status(500).json({ error: 'Erro ao completar tarefa' });
    }
};
exports.completeTask = completeTask;
// Função para calcular nível
const calculateLevel = (xp) => {
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
const getStats = async (req, res) => {
    try {
        const authReq = req;
        const tasks = await prisma_1.default.task.findMany({
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
        const recentCompleted = completedTasks.filter(t => t.completedAt && new Date(t.completedAt) > sevenDaysAgo).length;
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
    }
    catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
};
exports.getStats = getStats;
//# sourceMappingURL=taskController.js.map