"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const db_1 = require("./db");
const participantRoutes_1 = require("./routes/participantRoutes");
const app = (0, express_1.default)();
const port = Number(process.env.PORT || 8787);
app.use((0, cors_1.default)({
    origin: [
        'https://arjav5090.github.io',
        'http://localhost:3000',
        'http://localhost:3001',
        ...(process.env.CORS_ORIGIN?.split(',') ?? [])
    ],
    credentials: true
}));
app.use(express_1.default.json({ limit: '2mb' }));
app.use(participantRoutes_1.router);
// routes
app.get('/health', (_, res) => res.json({ ok: true }));
app.listen(port, async () => {
    await (0, db_1.connectPostgres)();
    console.log(`[backend] running at http://localhost:${port}`);
});
