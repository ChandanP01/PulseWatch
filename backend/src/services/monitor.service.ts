import { Monitor, IMonitor, HttpMethod } from '../models/Monitor.js';
import { Heartbeat } from '../models/Heartbeat.js';
import { Incident } from '../models/Incident.js';
import { AppError } from '../middleware/errorHandler.js';
import { logAuditEvent } from './audit.service.js';
import { scheduler } from '../engine/scheduler.js';

export async function listMonitors(orgId: string) {
  return Monitor.find({ orgId }).sort({ createdAt: -1 });
}

export async function getMonitorById(monitorId: string, orgId: string) {
  const monitor = await Monitor.findOne({ _id: monitorId, orgId });
  if (!monitor) {
    throw new AppError('Monitor not found', 404);
  }
  return monitor;
}

export async function createMonitor(
  data: {
    name: string;
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    intervalSeconds?: number;
    timeoutMs?: number;
    expectedStatusCode?: number;
    keyword?: string;
    sslCheckEnabled?: boolean;
  },
  userId: string,
  orgId: string,
  ipAddress?: string
) {
  const monitor: any = await Monitor.create({
    orgId,
    createdBy: userId,
    name: data.name,
    url: data.url,
    method: (data.method as HttpMethod) || 'GET',
    headers: data.headers || {},
    body: data.body || '',
    intervalSeconds: data.intervalSeconds || 60,
    timeoutMs: data.timeoutMs || 10000,
    expectedStatusCode: data.expectedStatusCode || 200,
    keyword: data.keyword || '',
    sslCheckEnabled: data.sslCheckEnabled !== false,
    isActive: true,
    currentStatus: 'PAUSED',
  });

  await logAuditEvent({
    orgId,
    userId,
    action: 'MONITOR_CREATED',
    details: { monitorId: monitor._id, name: monitor.name, url: monitor.url },
    ipAddress,
  });

  // Trigger initial check asynchronously so the user immediately gets a status!
  scheduler.executeCheck(monitor).catch(() => {});

  return monitor;
}

export async function updateMonitor(
  monitorId: string,
  data: Partial<IMonitor>,
  userId: string,
  orgId: string,
  ipAddress?: string
) {
  const monitor = await Monitor.findOne({ _id: monitorId, orgId });
  if (!monitor) {
    throw new AppError('Monitor not found', 404);
  }

  const allowedFields = [
    'name',
    'url',
    'method',
    'headers',
    'body',
    'intervalSeconds',
    'timeoutMs',
    'expectedStatusCode',
    'keyword',
    'sslCheckEnabled',
    'isActive',
  ];

  for (const field of allowedFields) {
    if ((data as any)[field] !== undefined) {
      (monitor as any)[field] = (data as any)[field];
    }
  }

  await monitor.save();

  await logAuditEvent({
    orgId,
    userId,
    action: 'MONITOR_UPDATED',
    details: { monitorId: monitor._id, name: monitor.name },
    ipAddress,
  });

  return monitor;
}

export async function deleteMonitor(monitorId: string, userId: string, orgId: string, ipAddress?: string) {
  const monitor = await Monitor.findOneAndDelete({ _id: monitorId, orgId });
  if (!monitor) {
    throw new AppError('Monitor not found', 404);
  }

  // Clean up associated heartbeats and incidents
  await Promise.all([
    Heartbeat.deleteMany({ monitorId }),
    Incident.deleteMany({ monitorId }),
  ]);

  await logAuditEvent({
    orgId,
    userId,
    action: 'MONITOR_DELETED',
    details: { monitorId, name: monitor.name },
    ipAddress,
  });

  return { success: true, message: 'Monitor and related metrics deleted.' };
}

export async function toggleMonitorStatus(monitorId: string, userId: string, orgId: string) {
  const monitor = await Monitor.findOne({ _id: monitorId, orgId });
  if (!monitor) {
    throw new AppError('Monitor not found', 404);
  }

  monitor.isActive = !monitor.isActive;
  if (!monitor.isActive) {
    monitor.currentStatus = 'PAUSED';
  } else {
    // Trigger immediate check when unpaused
    scheduler.executeCheck(monitor).catch(() => {});
  }

  await monitor.save();
  return monitor;
}

export async function getMonitorHeartbeats(monitorId: string, orgId: string, limit = 60) {
  await getMonitorById(monitorId, orgId);

  const heartbeats = await Heartbeat.find({ monitorId })
    .sort({ checkedAt: -1 })
    .limit(limit);

  return heartbeats.reverse(); // Return chronological order for charts
}
