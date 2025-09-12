"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const zod_1 = require("zod");
const Session_1 = require("./models/Session");
const db_1 = require("./db");
const participantRoutes_1 = require("./routes/participantRoutes");
const questionRoutes_1 = require("./routes/questionRoutes");
const app = (0, express_1.default)();
const port = Number(process.env.PORT || 8787);
app.use((0, cors_1.default)({ origin: process.env.CORS_ORIGIN?.split(',') ?? true }));
app.use(express_1.default.json({ limit: '2mb' }));
app.use(participantRoutes_1.router);
app.use(questionRoutes_1.questionRouter);
// secure with bearer token
app.use((req, res, next) => {
    if (!req.path.startsWith('/api/'))
        return next();
    const token = (req.headers.authorization ?? '').replace(/^Bearer\s/, '');
    if (token !== process.env.INGEST_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
});
// schemas
const EventItem = zod_1.z.object({
    type: zod_1.z.string().min(1),
    payload: zod_1.z.any().optional(),
    ts: zod_1.z.string().datetime().optional()
});
const IngestSchema = zod_1.z.object({
    participantId: zod_1.z.string().min(1),
    testId: zod_1.z.string().min(1),
    events: zod_1.z.array(EventItem).min(1).max(500),
    metadata: zod_1.z.object({
        durationMs: zod_1.z.number().optional(),
        userAgent: zod_1.z.string().optional(),
        browser: zod_1.z.string().optional(),
        os: zod_1.z.string().optional(),
        device: zod_1.z.string().optional()
    }).optional()
});
// routes
app.get('/health', (_, res) => res.json({ ok: true }));
app.post('/api/v1/ingest', async (req, res) => {
    const parse = IngestSchema.safeParse(req.body);
    if (!parse.success)
        return res.status(400).json({ error: parse.error.flatten() });
    const { participantId, testId, events, metadata } = parse.data;
    const doc = await Session_1.SessionModel.create({
        participantId,
        testId,
        events: events.map(e => ({
            type: e.type,
            payload: e.payload ?? {},
            ts: e.ts ? new Date(e.ts) : new Date()
        })),
        metadata: {
            ...metadata,
            ip: req.ip
        }
    });
    res.status(201).json({ ok: true, id: doc._id });
});
app.get('/api/v1/participant/:id', async (req, res) => {
    const { id } = req.params;
    const doc = await Session_1.SessionModel.findOne({ participantId: id });
    if (!doc)
        return res.status(404).json({ error: 'Not found' });
    res.json(doc);
});
app.listen(port, async () => {
    await (0, db_1.connectMongo)(process.env.MONGODB_URI);
    console.log(`[backend] running at http://localhost:${port}`);
});
