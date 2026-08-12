import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNowStrict } from 'date-fns';
import {
  Bell,
  CheckCircle2,
  ClipboardList,
  RotateCcw,
  Send,
  CalendarClock,
} from 'lucide-react';

import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../api/notifications';
import Skeleton from '../ui/Skeleton';

const TYPE_META = {
  'task-assigned': { icon: ClipboardList, tone: 'text-brand-600 bg-brand-50' },
  'task-submitted': { icon: Send, tone: 'text-amber-600 bg-amber-50' },
  'feedback-received': { icon: RotateCcw, tone: 'text-blue-600 bg-blue-50' },
  'task-approved': { icon: CheckCircle2, tone: 'text-emerald-600 bg-emerald-50' },
  'revision-requested': { icon: RotateCcw, tone: 'text-red-600 bg-red-50' },
  'deadline-soon': { icon: CalendarClock, tone: 'text-amber-600 bg-amber-50' },
};

/**
 * Unread count and list come from MongoDB via /api/notifications.
 * The socket doesn't push counts — it invalidates this query, which refetches.
 * That keeps the badge and the database in agreement.
 */
const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ['notifications'] });

  const readOne = useMutation({ mutationFn: markNotificationRead, onSuccess: refresh });
  const readAll = useMutation({ mutationFn: markAllNotificationsRead, onSuccess: refresh });

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const openNotification = (notification) => {
    if (!notification.read) readOne.mutate(notification._id);
    setOpen(false);
    if (notification.link) navigate(notification.link);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
        className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg sm:w-96">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => readAll.mutate()}
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-5/6" />
            </div>
          ) : isError ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-slate-600">
                Couldn&apos;t load notifications.
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-2 text-xs font-medium text-brand-600 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">
              Nothing yet — you&apos;re all caught up.
            </p>
          ) : (
            <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
              {notifications.map((notification) => {
                const meta = TYPE_META[notification.type] ?? TYPE_META['task-assigned'];
                const Icon = meta.icon;

                return (
                  <li key={notification._id}>
                    <button
                      type="button"
                      onClick={() => openNotification(notification)}
                      className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                        notification.read ? '' : 'bg-brand-50/40'
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.tone}`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-slate-900">
                            {notification.title}
                          </span>
                          {!notification.read && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                          )}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-600">
                          {notification.message}
                        </span>
                        <span className="mt-1 block text-xs text-slate-400">
                          {formatDistanceToNowStrict(new Date(notification.createdAt))} ago
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
