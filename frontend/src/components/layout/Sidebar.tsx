import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  Users,
  ScrollText,
  Activity,
  Server,
} from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  activeIncidentsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeIncidentsCount = 0 }) => {
  const navItems = [
    {
      to: '/',
      label: 'Overview & Monitors',
      icon: LayoutDashboard,
    },
    {
      to: '/incidents',
      label: 'Incidents Center',
      icon: AlertTriangle,
      badge: activeIncidentsCount > 0 ? activeIncidentsCount : undefined,
    },
    {
      to: '/team',
      label: 'Team & RBAC',
      icon: Users,
    },
    {
      to: '/audit',
      label: 'Audit Trail',
      icon: ScrollText,
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/40 flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Platform Operations
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                )
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500 text-white animate-pulse">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Engine Status Widget */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-medium text-slate-300">
            <Server className="w-3.5 h-3.5 text-sky-400" />
            Worker Engine
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
            Online
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Concurrent HTTP probes active with SSL verification & incident dispatching.
        </p>
      </div>
    </aside>
  );
};
