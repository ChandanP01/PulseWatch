import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.js';
import { Sidebar } from './Sidebar.js';
import { api } from '../../services/api.js';

export const AppLayout: React.FC = () => {
  const [activeIncidentsCount, setActiveIncidentsCount] = useState(0);

  const fetchOverview = async () => {
    try {
      const { data } = await api.get('/analytics/overview');
      setActiveIncidentsCount(data.data.activeIncidentsCount || 0);
    } catch {
      // Ignore background refresh errors
    }
  };

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar activeIncidentsCount={activeIncidentsCount} />
      <div className="flex flex-1">
        <Sidebar activeIncidentsCount={activeIncidentsCount} />
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
