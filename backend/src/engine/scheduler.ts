import { Monitor, IMonitor } from '../models/Monitor.js';
import { runProbe, ProbeResult } from './probe.js';
import { processMonitorCheckResult } from './stateMachine.js';
import { config } from '../config/env.js';

class MonitoringScheduler {
  private isRunning = false;
  private timer: NodeJS.Timeout | null = null;
  private inFlightChecks = new Set<string>();
  private concurrencyLimit = config.worker.concurrency;

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[Scheduler] Monitoring Engine started. Tick interval: 5s, Max Concurrency: ${this.concurrencyLimit}`);

    // Initial tick after 1s
    setTimeout(() => this.tick(), 1000);
    this.timer = setInterval(() => this.tick(), 5000);
  }

  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('[Scheduler] Monitoring Engine stopped.');
  }

  /**
   * Main scheduling tick
   */
  private async tick(): Promise<void> {
    if (!this.isRunning) return;

    try {
      const now = new Date();

      // Find active monitors that are due for a check
      // A monitor is due if:
      // 1. lastCheckAt is null (never checked)
      // 2. now - lastCheckAt >= intervalSeconds * 1000
      const activeMonitors = await Monitor.find({ isActive: true });

      const dueMonitors = activeMonitors.filter((m) => {
        if (this.inFlightChecks.has(m._id.toString())) return false;
        if (!m.lastCheckAt) return true;
        const elapsedSeconds = (now.getTime() - m.lastCheckAt.getTime()) / 1000;
        return elapsedSeconds >= m.intervalSeconds;
      });

      if (dueMonitors.length === 0) return;

      // Slice up to concurrency limit
      const availableSlots = Math.max(0, this.concurrencyLimit - this.inFlightChecks.size);
      const batch = dueMonitors.slice(0, availableSlots);

      for (const monitor of batch) {
        this.executeCheck(monitor);
      }
    } catch (err: any) {
      console.error('[Scheduler] Error in monitoring tick:', err.message);
    }
  }

  /**
   * Executes a single monitor probe and processes state
   */
  public async executeCheck(monitor: IMonitor): Promise<ProbeResult> {
    const monitorIdStr = monitor._id.toString();
    this.inFlightChecks.add(monitorIdStr);

    try {
      const headersObj: Record<string, string> = {};
      if (monitor.headers) {
        if (monitor.headers instanceof Map) {
          monitor.headers.forEach((val, key) => {
            headersObj[key] = val;
          });
        } else if (typeof monitor.headers === 'object') {
          Object.assign(headersObj, monitor.headers);
        }
      }

      const probeResult = await runProbe({
        url: monitor.url,
        method: monitor.method,
        headers: headersObj,
        body: monitor.body,
        timeoutMs: monitor.timeoutMs,
        expectedStatusCode: monitor.expectedStatusCode,
        keyword: monitor.keyword,
        sslCheckEnabled: monitor.sslCheckEnabled,
      });

      await processMonitorCheckResult(monitor, probeResult);

      return probeResult;
    } catch (err: any) {
      console.error(`[Scheduler] Unexpected error probing ${monitor.name} (${monitor.url}):`, err.message);
      return {
        isReachable: false,
        statusCode: 0,
        responseTimeMs: 0,
        errorMessage: err.message,
      };
    } finally {
      this.inFlightChecks.delete(monitorIdStr);
    }
  }

  /**
   * Manually triggers an immediate check for a monitor (e.g., from Dashboard UI)
   */
  public async triggerManualCheck(monitorId: string): Promise<ProbeResult | null> {
    const monitor = await Monitor.findById(monitorId);
    if (!monitor) return null;

    return this.executeCheck(monitor);
  }
}

export const scheduler = new MonitoringScheduler();
