import React, { useState, useEffect } from 'react';
import { ScrollText, RefreshCw, User, Shield } from 'lucide-react';
import { AuditLog } from '../types/index.js';
import { api } from '../services/api.js';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/audit?limit=60');
      setLogs(data.data);
    } catch (err: any) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-sky-400" />
            Security & Audit Trail
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable log of system modifications, monitor configurations, and authentication events.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
          title="Refresh audit logs"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
            <span className="text-sm">Retrieving audit events...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No audit records captured yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-800 text-xs">
            {logs.map((log) => (
              <div key={log._id} className="p-4 hover:bg-slate-800/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700 font-semibold">
                      {log.action}
                    </span>
                    <span className="text-slate-200 font-medium">
                      by {log.userId?.name || 'System / Service Engine'}
                    </span>
                    {log.userId?.role && (
                      <span className="text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.2 rounded">
                        {log.userId.role}
                      </span>
                    )}
                  </div>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="text-[11px] font-mono text-slate-400 bg-slate-950/60 p-2 rounded border border-slate-800/60 max-w-xl break-all">
                      {JSON.stringify(log.details)}
                    </div>
                  )}
                </div>

                <div className="text-right text-[11px] text-slate-400 shrink-0">
                  <div>{new Date(log.createdAt).toLocaleString()}</div>
                  {log.ipAddress && <div className="text-slate-500 font-mono">IP: {log.ipAddress}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
