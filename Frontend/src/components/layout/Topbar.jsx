import { Menu } from 'lucide-react';

import useAuth from '../../hooks/useAuth';
import Avatar from '../ui/Avatar';
import NotificationBell from './NotificationBell';

const Topbar = ({ title, onMenuClick, actions }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="min-w-0 flex-1 truncate text-lg font-semibold text-slate-900">
        {title}
      </h1>

      {actions}

      <NotificationBell />

      <Avatar name={user?.name} src={user?.avatarUrl} size="sm" />
    </header>
  );
};

export default Topbar;
