import { Monitor, IMonitor, Heartbeat, Incident, AlertChannel, User } from '../models/index.js';
import { ProbeResult } from './probe.js';
import { sendDowntimeAlert, sendRecoveryAlert } from '../services/email.service.js';

/**
 * Calculates uptime percentage and average latency over the last 24h/7d/30d
 */
async function computeUptimeMetrics(monitorId: any): Promise<{
  uptime24h: number;
  uptime7d: number;
  uptime30d: number;
  avgResponseTime24h: number;
}> {
  const now = new Date();
  const d24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const d7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const d30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [res24h, res7d, res30d] = await Promise.all([
    Heartbeat.aggregate([
      { $match: { monitorId, checkedAt: { $gte: d24h } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          upCount: { $sum: { $cond: [{ $eq: ['$status', 'UP'] }, 1, 0] } },
          avgLatency: { $avg: '$responseTimeMs' },
        },
      },
    ]),
    Heartbeat.aggregate([
      { $match: { monitorId, checkedAt: { $gte: d7d } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          upCount: { $sum: { $cond: [{ $eq: ['$status', 'UP'] }, 1, 0] } },
        },
      },
    ]),
    Heartbeat.aggregate([
      { $match: { monitorId, checkedAt: { $gte: d30d } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          upCount: { $sum: { $cond: [{ $eq: ['$status', 'UP'] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const calcPct = (agg: any[]) => {
    if (!agg || agg.length === 0 || agg[0].total === 0) return 100;
    return Number(((agg[0].upCount / agg[0].total) * 100).toFixed(2));
  };

  const uptime24h = calcPct(res24h);
  const uptime7d = calcPct(res7d);
  const uptime30d = calcPct(res30d);
  const avgResponseTime24h = res24h.length > 0 && res24h[0].avgLatency ? Math.round(res24h[0].avgLatency) : 0;

  return { uptime24h, uptime7d, uptime30d, avgResponseTime24h };
}

/**
 * Dispatches alerts to configured channels and organization members
 */
async function dispatchAlerts(
  orgId: any,
  monitor: IMonitor,
  type: 'DOWN' | 'UP',
  details: { cause?: string; durationSeconds?: number; startedAt?: Date }
) {
  try {
    // 1. Check configured AlertChannels
    const channels = await AlertChannel.find({
      orgId,
      isEnabled: true,
      events: type,
    });

    const emailRecipients: string[] = [];
    for (const ch of channels) {
      if (ch.type === 'EMAIL') {
        emailRecipients.push(ch.target);
      }
    }

    // 2. If no custom channels, notify org admin/owner
    if (emailRecipients.length === 0) {
      const users = await User.find({ orgId, role: { $in: ['owner', 'admin'] } }).select('email');
      emailRecipients.push(...users.map((u) => u.email));
    }

    if (emailRecipients.length === 0) return;

    if (type === 'DOWN') {
      await sendDowntimeAlert({
        to: emailRecipients,
        monitorName: monitor.name,
        url: monitor.url,
        cause: details.cause || 'Service Unreachable',
        startedAt: details.startedAt,
      });
    } else {
      await sendRecoveryAlert({
        to: emailRecipients,
        monitorName: monitor.name,
        url: monitor.url,
        durationSeconds: details.durationSeconds,
      });
    }
  } catch (err: any) {
    console.error(`[Alert Dispatcher] Error sending ${type} alert:`, err.message);
  }
}

/**
 * Handles monitor state transitions and generates heartbeats and incidents
 */
export async function processMonitorCheckResult(monitor: IMonitor, probe: ProbeResult): Promise<void> {
  const now = new Date();
  const previousStatus = monitor.currentStatus;

  // 1. Create Heartbeat log
  const heartbeatStatus = probe.isReachable ? 'UP' : 'DOWN';
  await Heartbeat.create({
    monitorId: monitor._id,
    orgId: monitor.orgId,
    status: heartbeatStatus,
    statusCode: probe.statusCode,
    responseTimeMs: probe.responseTimeMs,
    certExpiryDays: probe.certExpiryDays,
    errorMessage: probe.errorMessage,
    checkedAt: now,
  });

  let nextStatus = previousStatus;
  let consecutiveFails = monitor.consecutiveFails || 0;

  if (probe.isReachable) {
    consecutiveFails = 0;
    nextStatus = 'UP';

    // Check if recovering from DOWN
    if (previousStatus === 'DOWN') {
      const activeIncident = await Incident.findOne({
        monitorId: monitor._id,
        status: { $in: ['OPEN', 'INVESTIGATING'] },
      }).sort({ startedAt: -1 });

      let duration = 0;
      if (activeIncident) {
        duration = Math.round((now.getTime() - activeIncident.startedAt.getTime()) / 1000);
        activeIncident.status = 'RESOLVED';
        activeIncident.resolvedAt = now;
        activeIncident.durationSeconds = duration;
        await activeIncident.save();
      }

      await dispatchAlerts(monitor.orgId, monitor, 'UP', { durationSeconds: duration });
    }
  } else {
    consecutiveFails += 1;
    // Require 1 failure if paused/new, or 2 consecutive failures to avoid transient jitter
    const threshold = previousStatus === 'PAUSED' ? 1 : 2;

    if (consecutiveFails >= threshold) {
      nextStatus = 'DOWN';

      // Check if transitioning to DOWN from UP/PAUSED
      if (previousStatus !== 'DOWN') {
        const cause = probe.errorMessage || `HTTP ${probe.statusCode}`;
        const incident = await Incident.create({
          monitorId: monitor._id,
          orgId: monitor.orgId,
          status: 'OPEN',
          cause,
          rootCauseSummary: `Monitor detected failure: ${cause}. Checked status was ${probe.statusCode} with latency ${probe.responseTimeMs}ms.`,
          startedAt: now,
        });

        await dispatchAlerts(monitor.orgId, monitor, 'DOWN', {
          cause,
          startedAt: incident.startedAt,
        });
      }
    }
  }

  // 2. Refresh rolling uptime metrics
  const metrics = await computeUptimeMetrics(monitor._id);

  // 3. Update monitor state
  monitor.currentStatus = nextStatus;
  monitor.lastCheckAt = now;
  monitor.lastStatusCode = probe.statusCode;
  monitor.lastResponseTimeMs = probe.responseTimeMs;
  monitor.lastErrorMessage = probe.errorMessage || '';
  monitor.certExpiryDays = probe.certExpiryDays;
  monitor.consecutiveFails = consecutiveFails;
  monitor.uptime24h = metrics.uptime24h;
  monitor.uptime7d = metrics.uptime7d;
  monitor.uptime30d = metrics.uptime30d;
  monitor.avgResponseTime24h = metrics.avgResponseTime24h;

  await monitor.save();
}
