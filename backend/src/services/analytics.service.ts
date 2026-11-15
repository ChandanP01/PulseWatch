import { Monitor } from '../models/Monitor.js';
import { Incident } from '../models/Incident.js';
import { Heartbeat } from '../models/Heartbeat.js';

export async function getDashboardOverview(orgId: string) {
  const monitors = await Monitor.find({ orgId });

  const totalMonitors = monitors.length;
  let upCount = 0;
  let downCount = 0;
  let pausedCount = 0;
  let totalUptime24hSum = 0;
  let totalLatencySum = 0;
  let latencyCount = 0;

  for (const m of monitors) {
    if (!m.isActive) {
      pausedCount++;
    } else if (m.currentStatus === 'UP') {
      upCount++;
    } else if (m.currentStatus === 'DOWN') {
      downCount++;
    }

    if (m.isActive) {
      totalUptime24hSum += m.uptime24h || 100;
      if (m.lastResponseTimeMs && m.lastResponseTimeMs > 0) {
        totalLatencySum += m.lastResponseTimeMs;
        latencyCount++;
      }
    }
  }

  const activeMonitorsCount = totalMonitors - pausedCount;
  const overallUptime24h = activeMonitorsCount > 0 ? Number((totalUptime24hSum / activeMonitorsCount).toFixed(2)) : 100;
  const avgResponseTimeMs = latencyCount > 0 ? Math.round(totalLatencySum / latencyCount) : 0;

  const activeIncidents = await Incident.find({
    orgId,
    status: { $in: ['OPEN', 'INVESTIGATING'] },
  })
    .populate('monitorId', 'name url')
    .sort({ startedAt: -1 });

  return {
    totalMonitors,
    activeMonitorsCount,
    upCount,
    downCount,
    pausedCount,
    overallUptime24h,
    avgResponseTimeMs,
    activeIncidentsCount: activeIncidents.length,
    activeIncidents,
  };
}
