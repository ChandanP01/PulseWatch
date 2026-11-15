import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, AppError } from './middleware/errorHandler.js';

export function createApp(): express.Application {
  const app = express();

  // Basic CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or Postman)
        if (!origin) return callback(null, true);
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logger in development
  if (config.nodeEnv === 'development') {
    app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`[HTTP] ${req.method} ${req.url}`);
      next();
    });
  }

  // Mount API routers
  app.use('/api', routes);

  // 404 Handler for undefined API routes
  app.use((req: Request, res: Response, next: NextFunction) => {
    next(new AppError(`Endpoint not found: ${req.method} ${req.originalUrl}`, 404));
  });

  // Central Error Handler
  app.use(errorHandler);

  return app;
}
