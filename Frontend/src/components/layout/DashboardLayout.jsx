import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import Sidebar from './Sidebar';
import Topbar from './Topbar';
import useLiveInvalidate from '../../hooks/useLiveInvalidate';

/** Route path → topbar title. Longest match wins. */
const TITLES = {
  '/admin': 'Dashboard',
  '/admin/interns': 'Interns',
  '/admin/tasks': 'Tasks',
  '/admin/review': 'Review Queue',
  '/intern': 'Dashboard',
  '/intern/tasks': 'My Tasks',
  '/intern/profile': 'Profile',
};

const titleFor = (pathname) => {
  const match = Object.keys(TITLES)
    .filter((path) => pathname === path || pathname.startsWith(`${path}/`))
    .sort((a, b) => b.length - a.length)[0];

  return TITLES[match] ?? 'InternTrack';
};

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();

  // Mounted exactly once for the whole authenticated app — putting this on a
  // page would re-register listeners on every navigation.
  useLiveInvalidate();

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Offset matches the 240px (w-60) sidebar on desktop. */}
      <div className="md:pl-60">
        <Topbar
          title={titleFor(pathname)}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
