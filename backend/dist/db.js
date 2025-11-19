"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.connectPostgres = connectPostgres;
exports.disconnectPostgres = disconnectPostgres;
const client_1 = require("@prisma/client");
// Create a single Prisma Client instance
const globalForPrisma = global;
exports.prisma = globalForPrisma.prisma ||
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = exports.prisma;
}
/**
 * Connect to PostgreSQL database
 * @param uri - PostgreSQL connection URI (not used with Prisma, reads from DATABASE_URL env)
 */
async function connectPostgres(uri) {
    try {
        // Test the connection
        await exports.prisma.$connect();
        console.log('[postgres] ✅ connected');
    }
    catch (err) {
        console.error('[postgres] ❌ connection failed:', err);
        throw err;
    }
}
/**
 * Disconnect from database
 */
async function disconnectPostgres() {
    await exports.prisma.$disconnect();
    console.log('[postgres] 👋 disconnected');
}
// Handle cleanup on process termination
process.on('beforeExit', async () => {
    await disconnectPostgres();
});
