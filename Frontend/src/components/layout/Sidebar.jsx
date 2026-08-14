import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  ClipboardCheck,
  UserCircle,
  LogOut,
  X,
} from 'lucide-react';

import useAuth from '../../hooks/useAuth';

const adminNav = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/interns', label: 'Interns', icon: Users },
  { to: '/admin/tasks', label: 'Task board', icon: ClipboardList },
  { to: '/admin/review', label: 'Reviews', icon: ClipboardCheck },
];

const internNav = [
  { to: '/intern', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/intern/tasks', label: 'My work', icon: ClipboardList },
  { to: '/intern/profile', label: 'Profile', icon: UserCircle },
];

/** The design's mark: a hairline square holding a glowing accent chip. */
const BrandMark = ({ size = 20 }) => (
  <div
    style={{ width: size, height: size }}
    className="grid shrink-0 place-items-center rounded-md border border-[var(--color-accent)]"
  >
    <div
      style={{
        width: size * 0.25,
        height: size * 0.25,
        boxShadow: '0 0 9px var(--color-accent)',
      }}
      className="rounded-[2px] bg-[var(--color-accent)]"
    />
  </div>
);

const Sidebar = ({ open, onClose }) => {
  const { user, logout, isAdmin } = useAuth();
  const navItems = isAdmin ? adminNav : internNav;

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-50/70 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex w-[216px] flex-col gap-6',
          'border-r border-[var(--color-divider)] bg-slate-50 px-3.5 py-5',
          'transition-transform duration-200 md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Brand */}
        <div className="flex items-center justify-between gap-2 px-2">
          <div className="flex items-center gap-2.5">
            <BrandMark />
            <span className="font-medium tracking-tight text-slate-900">
              InternTrack
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5">
          <div className="px-2 pb-2 text-[10px] tracking-[0.14em] text-slate-400 uppercase">
            {isAdmin ? 'Admin' : 'Intern'}
          </div>

          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  'flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13.5px] transition-colors',
                  isActive
                    ? 'bg-[color-mix(in_srgb,var(--color-text)_6%,transparent)] text-slate-900'
                    : 'text-slate-600 hover:bg-[color-mix(in_srgb,var(--color-text)_5%,transparent)] hover:text-slate-900',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className="h-4 w-4 shrink-0 transition-opacity"
                    style={{ opacity: isActive ? 1 : 0.45 }}
                  />
                  <span className="flex-1 truncate">{label}</span>
                  {isActive && (
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]"
                      style={{ boxShadow: '0 0 8px var(--color-accent)' }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User block */}
        <div className="mt-auto flex flex-col gap-1">
          <div className="rounded-lg border border-[var(--color-divider)] p-3">
            <div className="text-[10px] tracking-[0.12em] text-slate-400 uppercase">
              Signed in
            </div>
            <p className="mt-1.5 truncate text-sm text-slate-900">{user?.name}</p>
            <p className="truncate text-xs text-slate-500 capitalize">
              {user?.role}
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] text-slate-500 transition-colors hover:text-[var(--color-accent)]"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
