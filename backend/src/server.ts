import { createApp } from './app.js';
import { config } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { scheduler } from './engine/scheduler.js';

async function bootstrap() {
  try {
    console.log('--- Starting PulseWatch Backend Server ---');

    // 1. Connect to Database
    await connectDatabase();

    // 2. Start Background Monitoring Engine & Scheduler
    scheduler.start();

    // 3. Start Express HTTP Server
    const app = createApp();
    const server = app.listen(config.port, () => {
      console.log(`[PulseWatch Server] Running at http://localhost:${config.port}`);
      console.log(`[PulseWatch Server] Environment: ${config.nodeEnv}`);
      console.log(`[PulseWatch Server] Health endpoint: http://localhost:${config.port}/api/health`);
    });

    // 4. Graceful Shutdown
    const handleShutdown = async (signal: string) => {
      console.log(`\n[PulseWatch Server] Received ${signal}. Initiating graceful shutdown...`);
      scheduler.stop();
      server.close(async () => {
        console.log('[PulseWatch Server] HTTP server closed.');
        await disconnectDatabase();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  } catch (err: any) {
    console.error('[PulseWatch Server] Fatal bootstrap error:', err.message);
    process.exit(1);
  }
}

bootstrap();
