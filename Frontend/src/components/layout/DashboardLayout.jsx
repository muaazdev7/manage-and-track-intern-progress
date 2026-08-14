import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import Sidebar from './Sidebar';
import Topbar from './Topbar';
import useLiveInvalidate from '../../hooks/useLiveInvalidate';

/** Route path → [kicker, title] for the header, as the design lays it out. */
const TITLES = {
  '/admin': ['Programme', 'Overview'],
  '/admin/interns': ['Roster', 'Interns'],
  '/admin/tasks': ['Assignments', 'Task board'],
  '/admin/review': ['Awaiting decision', 'Review queue'],
  '/intern': ['Your progress', 'Overview'],
  '/intern/tasks': ['Assigned to you', 'My work'],
  '/intern/profile': ['Your account', 'Profile'],
};

const headerFor = (pathname) => {
  const match = Object.keys(TITLES)
    .filter((path) => pathname === path || pathname.startsWith(`${path}/`))
    .sort((a, b) => b.length - a.length)[0];

  return TITLES[match] ?? ['InternTrack', 'InternTrack'];
};

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();

  // Mounted exactly once for the whole authenticated app — putting this on a
  // page would re-register listeners on every navigation.
  useLiveInvalidate();

  const [kicker, title] = headerFor(pathname);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Offset matches the 216px sidebar on desktop. */}
      <div className="md:pl-[216px]">
        <Topbar
          title={title}
          kicker={kicker}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main key={pathname} className="rise-in p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
