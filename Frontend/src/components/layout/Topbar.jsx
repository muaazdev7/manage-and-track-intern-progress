import { Menu } from 'lucide-react';

import useAuth from '../../hooks/useAuth';
import NotificationBell from './NotificationBell';

/** Initials, as the design's avatar chip renders them. */
const initialsOf = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase() || '?';

const Topbar = ({ title, kicker, onMenuClick, actions }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex items-end gap-5 border-b border-[var(--color-divider)] bg-slate-50/95 px-4 pt-5 pb-4 backdrop-blur sm:px-8">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="mb-1 rounded-lg p-2 text-slate-500 hover:text-slate-900 md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        {kicker && (
          <div className="mb-1.5 truncate text-[10px] tracking-[0.14em] text-[var(--color-accent-300)] uppercase">
            {kicker}
          </div>
        )}
        <h1 className="truncate text-2xl tracking-tight text-slate-900">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2.5">
        {actions}

        <NotificationBell />

        <div className="flex items-center gap-2.5 border-l border-[var(--color-divider)] pl-3">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="h-[30px] w-[30px] rounded-full object-cover ring-1 ring-[var(--color-accent)]"
            />
          ) : (
            <div className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full border border-[var(--color-accent)] text-[11px] tracking-wide text-[var(--color-accent-300)]">
              {initialsOf(user?.name)}
            </div>
          )}
          <div className="hidden leading-tight sm:block">
            <div className="text-[13px] text-slate-900">{user?.name}</div>
            <div className="text-[11px] text-slate-400 capitalize">
              {user?.role}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
