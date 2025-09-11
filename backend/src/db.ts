import mongoose from 'mongoose';

export async function connectMongo(uri: string) {
  if (mongoose.connection.readyState === 1) return;

  try {
    await mongoose.connect(uri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 10000,
      ssl: true,
      tls: true,
      tlsAllowInvalidCertificates: false, // stricter, ensures proper handshake
    });
    console.log('[mongo] ✅ connected');
  } catch (err) {
    console.error('[mongo] ❌ connection failed:', err);
    throw err;
  }
}
