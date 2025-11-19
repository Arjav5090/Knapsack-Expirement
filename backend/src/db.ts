import { PrismaClient } from '@prisma/client';

// Create a single Prisma Client instance
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Connect to PostgreSQL database
 * @param uri - PostgreSQL connection URI (not used with Prisma, reads from DATABASE_URL env)
 */
export async function connectPostgres(uri?: string) {
  try {
    // Test the connection
    await prisma.$connect();
    console.log('[postgres] ✅ connected');
  } catch (err) {
    console.error('[postgres] ❌ connection failed:', err);
    throw err;
  }
}

/**
 * Disconnect from database
 */
export async function disconnectPostgres() {
  await prisma.$disconnect();
  console.log('[postgres] 👋 disconnected');
}

// Handle cleanup on process termination
process.on('beforeExit', async () => {
  await disconnectPostgres();
});
