import mongoose from 'mongoose';

export async function connectMongo(uri: string) {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(uri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 10000
  });
  console.log('[mongo] connected');
}
