"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskController_1 = require("../controllers/taskController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// Todas as rotas precisam de autenticação
router.use(auth_1.authMiddleware);
router.post('/', taskController_1.createTask);
router.get('/', taskController_1.getTasks);
router.get('/stats', taskController_1.getStats);
router.get('/:id', taskController_1.getTaskById);
router.put('/:id', taskController_1.updateTask);
router.delete('/:id', taskController_1.deleteTask);
router.post('/:id/complete', taskController_1.completeTask);
exports.default = router;
//# sourceMappingURL=tasks.js.map