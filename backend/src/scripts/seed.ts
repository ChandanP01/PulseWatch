import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { Organization } from '../models/Organization.js';
import { User } from '../models/User.js';
import { Monitor } from '../models/Monitor.js';
import { Heartbeat } from '../models/Heartbeat.js';
import { Incident } from '../models/Incident.js';
import { AlertChannel } from '../models/AlertChannel.js';

async function seed() {
  console.log('--- Starting PulseWatch Database Seeder ---');
  await connectDatabase();

  console.log('[Seed] Clearing existing collections...');
  await Promise.all([
    Organization.deleteMany({}),
    User.deleteMany({}),
    Monitor.deleteMany({}),
    Heartbeat.deleteMany({}),
    Incident.deleteMany({}),
    AlertChannel.deleteMany({}),
  ]);

  console.log('[Seed] Creating demo Organization...');
  const org = await Organization.create({
    name: 'Acme Cloud Operations',
    slug: 'acme-cloud',
    plan: 'pro',
    maxMonitors: 50,
    checkIntervalLimit: 30,
  });

  console.log('[Seed] Creating demo Users...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);

  const adminUser = await User.create({
    orgId: org._id,
    email: 'admin@pulsewatch.dev',
    passwordHash,
    name: 'Alex Mercer',
    role: 'owner',
  });

  await User.create({
    orgId: org._id,
    email: 'devops@pulsewatch.dev',
    passwordHash,
    name: 'Sarah Connor',
    role: 'admin',
  });

  console.log('[Seed] Creating Alert Channels...');
  await AlertChannel.create({
    orgId: org._id,
    name: 'DevOps Primary Alerts',
    type: 'EMAIL',
    target: 'admin@pulsewatch.dev',
    events: ['DOWN', 'UP', 'SSL_EXPIRING'],
    isEnabled: true,
  });

  console.log('[Seed] Creating realistic demo Monitors...');
  const monitorDefs = [
    {
      name: 'GitHub API Gateway',
      url: 'https://api.github.com/zen',
      method: 'GET' as const,
      intervalSeconds: 60,
      timeoutMs: 5000,
      expectedStatusCode: 200,
      sslCheckEnabled: true,
      currentStatus: 'UP' as const,
      uptime24h: 99.95,
      avgLatency: 75,
    },
    {
      name: 'Google Public DNS DoH',
      url: 'https://dns.google/resolve?name=example.com',
      method: 'GET' as const,
      intervalSeconds: 60,
      timeoutMs: 5000,
      expectedStatusCode: 200,
      sslCheckEnabled: true,
      currentStatus: 'UP' as const,
      uptime24h: 100,
      avgLatency: 35,
    },
    {
      name: 'Cloudflare Trace Edge',
      url: 'https://1.1.1.1/cdn-cgi/trace',
      method: 'GET' as const,
      intervalSeconds: 60,
      timeoutMs: 5000,
      expectedStatusCode: 200,
      keyword: 'fl=',
      sslCheckEnabled: true,
      currentStatus: 'UP' as const,
      uptime24h: 100,
      avgLatency: 28,
    },
    {
      name: 'HTTPBin Echo API',
      url: 'https://httpbin.org/get',
      method: 'GET' as const,
      intervalSeconds: 60,
      timeoutMs: 8000,
      expectedStatusCode: 200,
      sslCheckEnabled: true,
      currentStatus: 'UP' as const,
      uptime24h: 98.4,
      avgLatency: 180,
    },
    {
      name: 'Simulated Outage Endpoint (500)',
      url: 'https://httpstat.us/500',
      method: 'GET' as const,
      intervalSeconds: 60,
      timeoutMs: 5000,
      expectedStatusCode: 200,
      sslCheckEnabled: true,
      currentStatus: 'DOWN' as const,
      uptime24h: 62.5,
      avgLatency: 320,
    },
  ];

  const now = Date.now();

  for (const def of monitorDefs) {
    const monitor = await Monitor.create({
      orgId: org._id,
      createdBy: adminUser._id,
      name: def.name,
      url: def.url,
      method: def.method,
      intervalSeconds: def.intervalSeconds,
      timeoutMs: def.timeoutMs,
      expectedStatusCode: def.expectedStatusCode,
      keyword: def.keyword || '',
      sslCheckEnabled: def.sslCheckEnabled,
      isActive: true,
      currentStatus: def.currentStatus,
      lastCheckAt: new Date(now),
      lastStatusCode: def.currentStatus === 'UP' ? 200 : 500,
      lastResponseTimeMs: def.avgLatency,
      lastErrorMessage: def.currentStatus === 'DOWN' ? 'Received HTTP status 500, expected 200' : '',
      certExpiryDays: 84,
      uptime24h: def.uptime24h,
      uptime7d: 99.8,
      uptime30d: 99.5,
      avgResponseTime24h: def.avgLatency,
    });

    // Generate 30 realistic historical heartbeats
    const heartbeats = [];
    for (let i = 29; i >= 0; i--) {
      const checkTime = new Date(now - i * 60 * 1000);
      const isDownPoint = def.currentStatus === 'DOWN' && i < 12;
      const jitter = Math.floor(Math.random() * 25) - 12;

      heartbeats.push({
        monitorId: monitor._id,
        orgId: org._id,
        status: isDownPoint ? 'DOWN' : 'UP',
        statusCode: isDownPoint ? 500 : 200,
        responseTimeMs: Math.max(15, def.avgLatency + jitter),
        certExpiryDays: 84,
        errorMessage: isDownPoint ? 'Received HTTP status 500, expected 200' : undefined,
        checkedAt: checkTime,
      });
    }
    await Heartbeat.insertMany(heartbeats);

    // Create incident if DOWN
    if (def.currentStatus === 'DOWN') {
      await Incident.create({
        monitorId: monitor._id,
        orgId: org._id,
        status: 'OPEN',
        cause: 'HTTP 500 Internal Server Error',
        rootCauseSummary: 'Endpoint consistently responded with HTTP 500 status code.',
        startedAt: new Date(now - 12 * 60 * 1000),
      });
    }
  }

  // Create a resolved historical incident for demo
  const firstMonitor = await Monitor.findOne({ name: 'HTTPBin Echo API' });
  if (firstMonitor) {
    await Incident.create({
      monitorId: firstMonitor._id,
      orgId: org._id,
      status: 'RESOLVED',
      cause: 'Gateway Timeout (504)',
      rootCauseSummary: 'Upstream gateway took more than 8000ms to respond.',
      startedAt: new Date(now - 4 * 60 * 60 * 1000),
      resolvedAt: new Date(now - 3 * 60 * 60 * 1000 + 45 * 60 * 1000),
      durationSeconds: 900,
      acknowledgedBy: adminUser._id,
      acknowledgedAt: new Date(now - 4 * 60 * 60 * 1000 + 120 * 1000),
    });
  }

  console.log('\n============================================================');
  console.log('✅ PulseWatch Database Seed Completed Successfully!');
  console.log('Demo Credentials:');
  console.log('  Email:    admin@pulsewatch.dev');
  console.log('  Password: Password123!');
  console.log('  Role:     owner (Full Permissions)');
  console.log('============================================================\n');

  await disconnectDatabase();
}

seed().catch((err) => {
  console.error('[Seed Error]', err);
  process.exit(1);
});
