import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  Clock,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { Monitor } from '../../types/index.js';
import { SegmentedHeartbeatBar } from './SegmentedHeartbeatBar.js';
import { api } from '../../services/api.js';

interface MonitorCardProps {
  monitor: Monitor;
  onRefresh: () => void;
}

export const MonitorCard: React.FC<MonitorCardProps> = ({ monitor, onRefresh }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCheckNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsChecking(true);
    try {
      await api.post(`/monitors/${monitor._id}/check-now`);
      onRefresh();
    } catch (err: any) {
      alert(`Check failed: ${err.response?.data?.error?.message || err.message}`);
    } finally {
      setIsChecking(false);
    }
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsToggling(true);
    try {
      await api.patch(`/monitors/${monitor._id}/toggle`);
      onRefresh();
    } catch (err: any) {
      alert(`Toggle failed: ${err.response?.data?.error?.message || err.message}`);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete monitor "${monitor.name}"?`)) return;

    setIsDeleting(true);
    try {
      await api.delete(`/monitors/${monitor._id}`);
      onRefresh();
    } catch (err: any) {
      alert(`Delete failed: ${err.response?.data?.error?.message || err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const isUp = monitor.currentStatus === 'UP';
  const isDown = monitor.currentStatus === 'DOWN';
  const isPaused = !monitor.isActive || monitor.currentStatus === 'PAUSED';

  return (
    <div className="group relative rounded-xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-700 hover:bg-slate-900/90 transition-all shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Status & Identity */}
        <div className="flex items-start gap-3.5 min-w-0">
          {/* Status Dot */}
          <div className="mt-1">
            {isPaused ? (
              <span className="flex h-3 w-3 rounded-full bg-slate-500" title="Paused" />
            ) : isUp ? (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            ) : (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to={`/monitors/${monitor._id}`}
                className="font-semibold text-slate-100 hover:text-sky-400 transition-colors text-base truncate"
              >
                {monitor.name}
              </Link>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {monitor.method}
              </span>
              {monitor.sslCheckEnabled && monitor.certExpiryDays !== undefined && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded flex items-center gap-1 border ${
                    monitor.certExpiryDays < 15
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}
                  title={`SSL Certificate expires in ${monitor.certExpiryDays} days`}
                >
                  <ShieldCheck className="w-3 h-3" />
                  {monitor.certExpiryDays}d SSL
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
              <a
                href={monitor.url}
                target="_blank"
                rel="noreferrer"
                className="hover:text-sky-400 flex items-center gap-1 truncate max-w-xs"
              >
                {monitor.url}
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                every {monitor.intervalSeconds}s
              </span>
            </div>
          </div>
        </div>

        {/* Center / Stats: Uptime & Latency */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs text-slate-400">24h Uptime</div>
            <div
              className={`text-sm font-semibold ${
                (monitor.uptime24h || 100) >= 99
                  ? 'text-emerald-400'
                  : (monitor.uptime24h || 100) >= 95
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {monitor.uptime24h !== undefined ? `${monitor.uptime24h}%` : '100%'}
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400">Response Time</div>
            <div className="text-sm font-semibold text-slate-200">
              {monitor.lastResponseTimeMs ? `${monitor.lastResponseTimeMs}ms` : '—'}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
            <button
              onClick={handleCheckNow}
              disabled={isChecking}
              title="Trigger check now"
              className="p-2 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin text-sky-400' : ''}`} />
            </button>

            <button
              onClick={handleToggle}
              disabled={isToggling}
              title={monitor.isActive ? 'Pause monitoring' : 'Resume monitoring'}
              className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {monitor.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete monitor"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <Link
              to={`/monitors/${monitor._id}`}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Segmented Heartbeats preview line */}
      <div className="mt-4 pt-3 border-t border-slate-800/60">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
          <span>Recent Activity</span>
          <span>{monitor.currentStatus}</span>
        </div>
        <SegmentedHeartbeatBar barsCount={36} />
      </div>
    </div>
  );
};
