"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const achievementController_1 = require("../controllers/achievementController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authMiddleware, achievementController_1.getAchievements);
router.get('/leaderboard', achievementController_1.getLeaderboard);
exports.default = router;
//# sourceMappingURL=achievements.js.map