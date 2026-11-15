import mongoose from 'mongoose';
import { config } from './env.js';

export async function connectDatabase(): Promise<void> {
  try {
    mongoose.set('strictQuery', true);
    console.log(`[Database] Connecting to MongoDB at: ${config.mongodbUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
    
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('[Database] MongoDB connection established successfully.');
  } catch (error: any) {
    console.error('[Database] MongoDB connection failed:', error.message);
    console.warn(
      '\n============================================================\n' +
      '[Database Warning] Could not connect to MongoDB server.\n' +
      'Please ensure:\n' +
      ' 1. Local MongoDB service is running (e.g., net start MongoDB),\n' +
      ' 2. OR add your free MongoDB Atlas URI to backend/.env\n' +
      '    e.g. MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/pulsewatch\n' +
      '============================================================\n'
    );
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log('[Database] MongoDB disconnected cleanly.');
  } catch (err: any) {
    console.error('[Database] Error disconnecting MongoDB:', err.message);
  }
}
