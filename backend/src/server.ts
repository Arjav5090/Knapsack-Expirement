import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { SessionModel } from './models/Session';
import { connectMongo } from './db';
import { router as participantRoutes } from './routes/participantRoutes';

const app = express();
const port = Number(process.env.PORT || 8787);

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true }));
app.use(express.json({ limit: '2mb' }));
app.use(participantRoutes);
// secure with bearer token
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/')) return next();
  const token = (req.headers.authorization ?? '').replace(/^Bearer\s/, '');
  if (token !== process.env.INGEST_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// schemas
const EventItem = z.object({
  type: z.string().min(1),
  payload: z.any().optional(),
  ts: z.string().datetime().optional()
});

const IngestSchema = z.object({
  participantId: z.string().min(1),
  testId: z.string().min(1),
  events: z.array(EventItem).min(1).max(500),
  metadata: z.object({
    durationMs: z.number().optional(),
    userAgent: z.string().optional(),
    browser: z.string().optional(),
    os: z.string().optional(),
    device: z.string().optional()
  }).optional()
});

// routes
app.get('/health', (_, res) => res.json({ ok: true }));

app.post('/api/v1/ingest', async (req, res) => {
  const parse = IngestSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });

  const { participantId, testId, events, metadata } = parse.data;

  const doc = await SessionModel.create({
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
  const doc = await SessionModel.findOne({ participantId: id });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json(doc);
});

app.listen(port, async () => {
  await connectMongo(process.env.MONGODB_URI!);
  console.log(`[backend] running at http://localhost:${port}`);
});
