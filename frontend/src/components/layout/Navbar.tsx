import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Activity, LogOut, Settings, User } from 'lucide-react';

interface NavbarProps {
  activeIncidentsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeIncidentsCount = 0 }) => {
  const { user, organization, logout } = useAuth();

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/70 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <Link to="/" className="flex items-center gap-3 group">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
          <Activity className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            PulseWatch
          </span>
          <span className="text-[10px] ml-1.5 px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold uppercase tracking-wider">
            SaaS
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-4">
        {/* System Health Badge */}
        {activeIncidentsCount > 0 ? (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>{activeIncidentsCount} Service Incident Active</span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>All Systems Operational</span>
          </div>
        )}

        {/* User / Org Info */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
          <Link to="/settings" className="flex items-center gap-3 group text-left">
            <div className="text-right hidden md:block">
              <div className="text-sm font-medium text-slate-200 group-hover:text-sky-400 transition-colors">
                {user?.name}
              </div>
              <div className="text-xs text-slate-400 flex items-center justify-end gap-1">
                <span>{organization?.name || 'My Team'}</span>
                <span className="text-[10px] uppercase font-semibold text-sky-400 bg-slate-800 px-1 rounded">
                  {user?.role}
                </span>
              </div>
            </div>

            <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-slate-700 group-hover:border-sky-500 transition-all flex items-center justify-center text-slate-300 font-semibold text-xs overflow-hidden shadow-md">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : user?.name ? (
                user.name.slice(0, 2).toUpperCase()
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
          </Link>

          <Link
            to="/settings"
            title="Profile & Settings"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </Link>

          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
