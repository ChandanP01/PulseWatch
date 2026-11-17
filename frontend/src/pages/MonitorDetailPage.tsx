import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  Play,
  Pause,
  Trash2,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Server,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Monitor, Heartbeat, Incident } from '../types/index.js';
import { SegmentedHeartbeatBar } from '../components/monitors/SegmentedHeartbeatBar.js';
import { ConfirmModal } from '../components/common/ConfirmModal.js';
import { api } from '../services/api.js';
import toast from 'react-hot-toast';

export const MonitorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [monitor, setMonitor] = useState<Monitor | null>(null);
  const [heartbeats, setHeartbeats] = useState<Heartbeat[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchDetails = async () => {
    try {
      const [monitorRes, heartbeatsRes, incidentsRes] = await Promise.all([
        api.get(`/monitors/${id}`),
        api.get(`/monitors/${id}/heartbeats?limit=60`),
        api.get('/incidents'),
      ]);

      setMonitor(monitorRes.data.data);
      setHeartbeats(heartbeatsRes.data.data);

      // Filter incidents for this monitor
      const allIncidents: Incident[] = incidentsRes.data.data;
      const related = allIncidents.filter((inc) => {
        const monId = typeof inc.monitorId === 'object' ? inc.monitorId._id : inc.monitorId;
        return monId === id;
      });
      setIncidents(related);
    } catch (err: any) {
      console.error('Failed to load monitor details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    const interval = setInterval(fetchDetails, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const handleCheckNow = async () => {
    setIsChecking(true);
    const toastId = toast.loading(`Probing ${monitor?.name || 'endpoint'}...`);
    try {
      const { data } = await api.post(`/monitors/${id}/check-now`);
      const res = data.data.probeResult;
      if (res.isReachable) {
        toast.success(`Success! HTTP ${res.statusCode} in ${res.responseTimeMs}ms`, { id: toastId });
      } else {
        toast.error(`Probe failed: ${res.errorMessage || 'HTTP failure'}`, { id: toastId });
      }
      await fetchDetails();
    } catch (err: any) {
      toast.error(`Check failed: ${err.response?.data?.error?.message || err.message}`, { id: toastId });
    } finally {
      setIsChecking(false);
    }
  };

  const handleToggle = async () => {
    try {
      await api.patch(`/monitors/${id}/toggle`);
      toast.success(monitor?.isActive ? 'Monitor paused' : 'Monitor resumed');
      await fetchDetails();
    } catch (err: any) {
      toast.error(`Toggle failed: ${err.response?.data?.error?.message || err.message}`);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    const toastId = toast.loading('Deleting monitor and metrics...');
    try {
      await api.delete(`/monitors/${id}`);
      toast.success('Monitor deleted successfully', { id: toastId });
      navigate('/');
    } catch (err: any) {
      toast.error(`Delete failed: ${err.response?.data?.error?.message || err.message}`, { id: toastId });
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
        <span className="text-sm">Loading telemetry metrics...</span>
      </div>
    );
  }

  if (!monitor) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-4">
        <p>Monitor not found or has been removed.</p>
        <Link to="/" className="text-sky-400 hover:underline text-sm">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Format heartbeats for Recharts
  const chartData = heartbeats.map((hb) => ({
    time: new Date(hb.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    latency: hb.responseTimeMs,
    status: hb.status,
    code: hb.statusCode,
  }));

  const isUp = monitor.currentStatus === 'UP';

  return (
    <div className="space-y-6">
      {/* Back button & Monitor Header */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Monitors
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-start gap-4">
            <div className="mt-1.5">
              {monitor.currentStatus === 'UP' ? (
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
                </span>
              ) : monitor.currentStatus === 'DOWN' ? (
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500" />
                </span>
              ) : (
                <span className="flex h-4 w-4 rounded-full bg-slate-500" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-slate-100">{monitor.name}</h1>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {monitor.method}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                    monitor.currentStatus === 'UP'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : monitor.currentStatus === 'DOWN'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {monitor.currentStatus}
                </span>
                {monitor.certExpiryDays !== undefined && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    SSL Valid ({monitor.certExpiryDays} days left)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                <a
                  href={monitor.url}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-sky-400 flex items-center gap-1"
                >
                  {monitor.url}
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </a>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Check frequency: {monitor.intervalSeconds}s
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCheckNow}
              disabled={isChecking}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-sky-400' : ''}`} />
              Check Now
            </button>

            <button
              onClick={handleToggle}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700"
            >
              {monitor.isActive ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-400" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  Resume
                </>
              )}
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium transition-colors border border-rose-500/30"
              title="Delete monitor"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Uptime Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400">24-Hour Uptime</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {monitor.uptime24h !== undefined ? `${monitor.uptime24h}%` : '100%'}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400">7-Day Uptime</div>
          <div className="text-2xl font-bold text-slate-100 mt-1">
            {monitor.uptime7d !== undefined ? `${monitor.uptime7d}%` : '100%'}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400">30-Day Uptime</div>
          <div className="text-2xl font-bold text-slate-100 mt-1">
            {monitor.uptime30d !== undefined ? `${monitor.uptime30d}%` : '100%'}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400">Avg Latency (24h)</div>
          <div className="text-2xl font-bold text-sky-400 mt-1">
            {monitor.avgResponseTime24h ? `${monitor.avgResponseTime24h}ms` : '—'}
          </div>
        </div>
      </div>

      {/* Performance Latency Area Chart */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-slate-200">Response Time Telemetry (ms)</h2>
          </div>
          <span className="text-xs text-slate-400">Last 60 check events</span>
        </div>

        <div className="h-64 w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              Awaiting heartbeat check data points...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="ms" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 bg-slate-900 border border-slate-700 rounded-lg shadow-xl text-xs space-y-1">
                          <p className="font-semibold text-slate-200">{label}</p>
                          <p className="text-sky-400 font-bold">Latency: {data.latency}ms</p>
                          <p className="text-slate-400">Status: {data.status} (HTTP {data.code})</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="latency"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#latencyGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* High Density Heartbeats Segmented Bar */}
        <div className="pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Historical Heartbeat Stream</span>
            <span>{heartbeats.length} records</span>
          </div>
          <SegmentedHeartbeatBar heartbeats={heartbeats} barsCount={50} />
        </div>
      </div>

      {/* Incident History Timeline for this Monitor */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <h2 className="text-sm font-bold text-slate-200">Incident History</h2>
          </div>
          <span className="text-xs text-slate-400">{incidents.length} recorded</span>
        </div>

        {incidents.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>No incidents recorded for this monitor. Pristine uptime history!</span>
          </div>
        ) : (
          <div className="space-y-3">
            {incidents.map((incident) => {
              const isOpen = incident.status === 'OPEN' || incident.status === 'INVESTIGATING';
              return (
                <div
                  key={incident._id}
                  className={`p-4 rounded-xl border ${
                    isOpen
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${
                            isOpen ? 'bg-rose-500 text-white' : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {incident.status}
                        </span>
                        <span className="font-semibold text-sm text-slate-100">{incident.cause}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{incident.rootCauseSummary}</p>
                    </div>

                    <div className="text-right text-xs text-slate-400 shrink-0">
                      <div>Started: {new Date(incident.startedAt).toLocaleString()}</div>
                      {incident.resolvedAt && (
                        <div className="text-emerald-400 font-medium">
                          Duration:{' '}
                          {incident.durationSeconds
                            ? `${Math.floor(incident.durationSeconds / 60)}m ${incident.durationSeconds % 60}s`
                            : 'under 1m'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Monitor Permanently?"
        message="Are you sure you want to delete this monitor? All collected latency metrics, SSL monitoring logs, and incident records will be deleted forever."
        itemName={`${monitor.name} (${monitor.url})`}
        confirmText="Delete Monitor"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
};
