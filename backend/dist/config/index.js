"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
exports.default = {
    port: process.env.PORT || 3001,
    jwtSecret: process.env.JWT_SECRET || 'sbrtask-secret-key',
    databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sbrtask',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
};
//# sourceMappingURL=index.js.map