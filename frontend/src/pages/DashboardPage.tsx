import React, { useState, useEffect } from 'react';
import {
  Activity,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  Zap,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Monitor, DashboardOverview } from '../types/index.js';
import { MonitorCard } from '../components/monitors/MonitorCard.js';
import { CreateMonitorModal } from '../components/monitors/CreateMonitorModal.js';
import { api } from '../services/api.js';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'UP' | 'DOWN' | 'PAUSED'>('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [monitorsRes, overviewRes] = await Promise.all([
        api.get('/monitors'),
        api.get('/analytics/overview'),
      ]);
      setMonitors(monitorsRes.data.data);
      setOverview(overviewRes.data.data);
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Polling every 10s for live heartbeats
    return () => clearInterval(interval);
  }, []);

  const filteredMonitors = monitors.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.url.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === 'ALL') return true;
    if (filter === 'PAUSED') return !m.isActive || m.currentStatus === 'PAUSED';
    return m.isActive && m.currentStatus === filter;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Incident Alert if any active */}
      {overview && overview.activeIncidentsCount > 0 && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-rose-300">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <span className="font-semibold text-rose-200">
                {overview.activeIncidentsCount} Service Incident Active
              </span>
              <p className="text-xs text-rose-300/80 mt-0.5">
                One or more endpoints are failing health probes. Alerts have been dispatched.
              </p>
            </div>
          </div>
          <Link
            to="/incidents"
            className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-xs font-semibold transition-colors shrink-0"
          >
            Review Incidents
          </Link>
        </div>
      )}

      {/* Metrics Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: System Uptime */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Overall Uptime (24h)</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-100">
              {overview?.overallUptime24h ?? 100}%
            </span>
            <span className="text-xs text-emerald-400 font-semibold">Healthy</span>
          </div>
          <div className="mt-3 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-sky-400 rounded-full"
              style={{ width: `${Math.min(100, overview?.overallUptime24h ?? 100)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Monitored Services */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Monitors</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-100">
              {overview?.totalMonitors ?? 0}
            </span>
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="text-emerald-400 flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" />
                {overview?.upCount ?? 0}
              </span>
              <span className="text-rose-400 flex items-center gap-0.5">
                <AlertCircle className="w-3 h-3" />
                {overview?.downCount ?? 0}
              </span>
              <span className="text-slate-400 flex items-center gap-0.5">
                <PauseCircle className="w-3 h-3" />
                {overview?.pausedCount ?? 0}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Continuously verified by worker pool</p>
        </div>

        {/* Card 3: Avg Response Time */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Average Latency</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-100">
              {overview?.avgResponseTimeMs ?? 0}ms
            </span>
            <span className="text-xs text-slate-400">across active targets</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Calculated over last 24 hours</p>
        </div>

        {/* Card 4: Active Incidents */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Active Incidents</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold ${
                (overview?.activeIncidentsCount ?? 0) > 0 ? 'text-rose-400' : 'text-slate-100'
              }`}
            >
              {overview?.activeIncidentsCount ?? 0}
            </span>
            <span className="text-xs text-slate-400">unresolved</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            {(overview?.activeIncidentsCount ?? 0) === 0
              ? 'Zero active incidents'
              : 'Requires engineer attention'}
          </p>
        </div>
      </div>

      {/* Action Bar: Search, Filters & Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        {/* Search & Filter pills */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter monitors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            {(['ALL', 'UP', 'DOWN', 'PAUSED'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  filter === mode
                    ? 'bg-slate-800 text-sky-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode === 'ALL' ? 'All' : mode === 'UP' ? 'Up' : mode === 'DOWN' ? 'Down' : 'Paused'}
              </button>
            ))}
          </div>
        </div>

        {/* Add Monitor CTA */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold transition-colors shadow-lg shadow-sky-500/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Monitor</span>
        </button>
      </div>

      {/* Monitors List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
            <span className="text-sm">Loading monitoring telemetry...</span>
          </div>
        ) : filteredMonitors.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl space-y-3">
            <Activity className="w-8 h-8 text-slate-500 mx-auto" />
            <div className="text-sm font-medium text-slate-300">No monitors match criteria</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Get started by registering a website URL or API endpoint for automated 24/7 uptime
              audits.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-sky-500 text-white text-xs font-semibold hover:bg-sky-400 transition-colors"
            >
              Add First Monitor
            </button>
          </div>
        ) : (
          filteredMonitors.map((monitor) => (
            <MonitorCard key={monitor._id} monitor={monitor} onRefresh={fetchData} />
          ))
        )}
      </div>

      {/* Create Modal */}
      <CreateMonitorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
};
