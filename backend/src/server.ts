import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectPostgres } from './db';
import { router as participantRoutes } from './routes/participantRoutes';

const app = express();
const port = Number(process.env.PORT || 8787);

app.use(cors({ 
  origin: [
    'https://arjav5090.github.io',
    'http://localhost:3000',
    'http://localhost:3001',
    ...(process.env.CORS_ORIGIN?.split(',') ?? [])
  ],
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));
app.use(participantRoutes);

// routes
app.get('/health', (_, res) => res.json({ ok: true }));

app.listen(port, async () => {
  await connectPostgres();
  console.log(`[backend] running at http://localhost:${port}`);
});
