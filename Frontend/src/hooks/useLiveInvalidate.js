import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import useSocket from './useSocket';

/**
 * Maps each server event (PROJECT_PLAN.md §8) to the query caches it
 * invalidates. React Query then refetches only what is on screen, so the UI
 * updates without a refresh and without hand-written state merging.
 */
const EVENT_INVALIDATIONS = {
  'task:assigned': [['my-tasks'], ['tasks'], ['intern-dashboard']],
  'task:updated': [
    ['my-tasks'],
    ['tasks'],
    ['task'],
    ['intern-dashboard'],
    ['admin-dashboard'],
    ['pending-submissions'],
  ],
  'task:deleted': [['my-tasks'], ['tasks'], ['intern-dashboard']],
  'submission:new': [
    ['pending-submissions'],
    ['admin-dashboard'],
    ['tasks'],
    ['submissions'],
  ],
  'feedback:received': [
    ['my-tasks'],
    ['task'],
    ['submissions'],
    ['intern-dashboard'],
  ],
  'progress:updated': [['admin-dashboard'], ['interns'], ['intern']],
  'notification:new': [['notifications']],
};

/**
 * Mounted exactly once, inside DashboardLayout.
 *
 * Every listener is removed in the cleanup — without that, each navigation
 * would stack another handler on the same socket and a single event would
 * fire its invalidations (and toast) two, three, four times over.
 */
const useLiveInvalidate = () => {
  const socket = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return undefined;

    const handlers = Object.entries(EVENT_INVALIDATIONS).map(([event, keys]) => {
      const handler = (payload) => {
        keys.forEach((queryKey) =>
          queryClient.invalidateQueries({ queryKey })
        );

        if (event === 'notification:new' && payload?.title) {
          toast(payload.title, { icon: '🔔' });
        }
      };

      socket.on(event, handler);
      return [event, handler];
    });

    return () => {
      handlers.forEach(([event, handler]) => socket.off(event, handler));
    };
  }, [socket, queryClient]);
};

export default useLiveInvalidate;
