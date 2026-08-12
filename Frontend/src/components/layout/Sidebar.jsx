import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  ClipboardCheck,
  UserCircle,
  GraduationCap,
  LogOut,
  X,
} from 'lucide-react';

import useAuth from '../../hooks/useAuth';
import Avatar from '../ui/Avatar';

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/interns', label: 'Interns', icon: Users },
  { to: '/admin/tasks', label: 'Tasks', icon: ClipboardList },
  { to: '/admin/review', label: 'Review', icon: ClipboardCheck },
];

const internNav = [
  { to: '/intern', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/intern/tasks', label: 'My Tasks', icon: ClipboardList },
  { to: '/intern/profile', label: 'Profile', icon: UserCircle },
];

const Sidebar = ({ open, onClose }) => {
  const { user, logout, isAdmin } = useAuth();
  const navItems = isAdmin ? adminNav : internNav;

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex w-60 flex-col',
          'border-r border-slate-200 bg-white',
          'transition-transform duration-200 md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-base font-semibold text-slate-900">
              InternTrack
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                ].join(' ')
              }
            >
              <Icon className="h-4.5 w-4.5" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User block */}
        <div className="shrink-0 border-t border-slate-200 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar name={user?.name} src={user?.avatarUrl} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">
                {user?.name}
              </p>
              <p className="truncate text-xs text-slate-500 capitalize">
                {user?.role}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4.5 w-4.5" />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
