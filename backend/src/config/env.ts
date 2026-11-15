import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/pulsewatch',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'pulsewatch_access_secret_key_default',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'pulsewatch_refresh_secret_key_default',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'PulseWatch Alerts <alerts@pulsewatch.dev>',
  },
  worker: {
    defaultInterval: parseInt(process.env.DEFAULT_CHECK_INTERVAL || '60', 10),
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '10', 10),
  },
};
