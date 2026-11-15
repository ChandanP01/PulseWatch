import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Clock, ShieldAlert, Check, RefreshCw } from 'lucide-react';
import { Incident } from '../types/index.js';
import { api } from '../services/api.js';

export const IncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  const fetchIncidents = async () => {
    try {
      const { data } = await api.get('/incidents');
      setIncidents(data.data);
    } catch (err: any) {
      console.error('Failed to fetch incidents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = async (incidentId: string) => {
    setAcknowledgingId(incidentId);
    try {
      await api.post(`/incidents/${incidentId}/acknowledge`);
      await fetchIncidents();
    } catch (err: any) {
      alert(`Acknowledge failed: ${err.response?.data?.error?.message || err.message}`);
    } finally {
      setAcknowledgingId(null);
    }
  };

  const filtered = incidents.filter((inc) => {
    if (filter === 'ACTIVE') return inc.status === 'OPEN' || inc.status === 'INVESTIGATING';
    if (filter === 'RESOLVED') return inc.status === 'RESOLVED';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            Incidents Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time downtime detection, diagnostic root-cause logs, and resolution tracking.
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-xs self-start">
          {(['ALL', 'ACTIVE', 'RESOLVED'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filter === mode
                  ? 'bg-slate-800 text-sky-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode === 'ALL' ? 'All Incidents' : mode === 'ACTIVE' ? 'Active / Open' : 'Resolved'}
            </button>
          ))}
        </div>
      </div>

      {/* Incidents List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
            <span className="text-sm">Loading incident telemetry...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <div className="text-sm font-semibold text-slate-200">
              {filter === 'ACTIVE' ? 'No active incidents' : 'No incidents found'}
            </div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              All monitored endpoints and APIs are operating normally.
            </p>
          </div>
        ) : (
          filtered.map((inc) => {
            const isOpen = inc.status === 'OPEN';
            const isInvestigating = inc.status === 'INVESTIGATING';
            const isResolved = inc.status === 'RESOLVED';
            const monitorName = typeof inc.monitorId === 'object' ? inc.monitorId.name : 'Target Monitor';
            const monitorUrl = typeof inc.monitorId === 'object' ? inc.monitorId.url : '';

            return (
              <div
                key={inc._id}
                className={`p-5 rounded-2xl border transition-all ${
                  isOpen
                    ? 'bg-rose-500/10 border-rose-500/30'
                    : isInvestigating
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          isOpen
                            ? 'bg-rose-500 text-white'
                            : isInvestigating
                            ? 'bg-amber-500 text-slate-950 font-extrabold'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {inc.status}
                      </span>
                      <h3 className="font-bold text-slate-100 text-base">{monitorName}</h3>
                      <span className="text-xs text-rose-400 font-semibold">• {inc.cause}</span>
                    </div>

                    {monitorUrl && (
                      <p className="text-xs text-slate-400 font-mono mt-1">{monitorUrl}</p>
                    )}

                    <p className="text-xs text-slate-300 mt-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                      <span className="font-semibold text-slate-400">Diagnosis: </span>
                      {inc.rootCauseSummary}
                    </p>

                    {inc.acknowledgedBy && (
                      <p className="text-[11px] text-amber-400/90 mt-2">
                        Investigated by {inc.acknowledgedBy.name} (
                        {new Date(inc.acknowledgedAt!).toLocaleTimeString()})
                      </p>
                    )}
                  </div>

                  {/* Right side: timestamps & acknowledge button */}
                  <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
                    <div className="text-xs text-slate-400 space-y-0.5 text-left md:text-right">
                      <div>
                        Started:{' '}
                        <span className="text-slate-200">
                          {new Date(inc.startedAt).toLocaleString()}
                        </span>
                      </div>
                      {isResolved && inc.resolvedAt && (
                        <div>
                          Resolved:{' '}
                          <span className="text-emerald-400 font-medium">
                            {new Date(inc.resolvedAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {inc.durationSeconds ? (
                        <div className="text-slate-300 font-semibold flex items-center gap-1 md:justify-end">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          Duration: {Math.floor(inc.durationSeconds / 60)}m {inc.durationSeconds % 60}s
                        </div>
                      ) : (
                        <div className="text-rose-400 font-semibold animate-pulse">Ongoing outage</div>
                      )}
                    </div>

                    {isOpen && (
                      <button
                        onClick={() => handleAcknowledge(inc._id)}
                        disabled={acknowledgingId === inc._id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {acknowledgingId === inc._id ? 'Acknowledging...' : 'Acknowledge Incident'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
