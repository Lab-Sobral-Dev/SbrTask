"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const config_1 = __importDefault(require("./config"));
const auth_1 = __importDefault(require("./routes/auth"));
const tasks_1 = __importDefault(require("./routes/tasks"));
const achievements_1 = __importDefault(require("./routes/achievements"));
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// Socket.io setup
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: config_1.default.corsOrigin,
        methods: ['GET', 'POST']
    }
});
exports.io = io;
// Middleware
app.use((0, cors_1.default)({ origin: config_1.default.corsOrigin }));
app.use(express_1.default.json());
// Rotas
app.use('/api/auth', auth_1.default);
app.use('/api/tasks', tasks_1.default);
app.use('/api/achievements', achievements_1.default);
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);
    socket.on('join-user-room', (userId) => {
        socket.join(`user-${userId}`);
        console.log(`Usuário ${userId} entrou na sala`);
    });
    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});
// Iniciar servidor
httpServer.listen(config_1.default.port, () => {
    console.log(`Servidor rodando na porta ${config_1.default.port}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map