import Notification from '../models/Notification.js';
import { emitToUser, emitToAdmins } from '../config/socket.js';
import { getProgressFor } from './progress.js';

/**
 * The single path every notification takes: persist it, then push it.
 *
 * Both halves matter — the document is what the bell reads on page load and
 * what survives a disconnect; the emit is what makes the badge move without a
 * refresh. Routing one through only half of this would produce a bell that
 * disagrees with the database.
 */
export const notify = async ({ user, type, title, message, link }) => {
  const notification = await Notification.create({
    user,
    type,
    title,
    message,
    link,
  });

  emitToUser(user, 'notification:new', notification);

  return notification;
};

/**
 * Notify several users of the same thing (bulk task assignment).
 */
export const notifyMany = async (userIds, build) => {
  const notifications = await Promise.all(
    userIds.map((user) => notify({ user, ...build(user) }))
  );
  return notifications;
};

/**
 * Recompute an intern's progress and broadcast it to the admin room, so the
 * dashboard's progress panel moves the moment a task changes state
 * (PROJECT_PLAN.md §8).
 */
export const emitProgressUpdate = async (internId) => {
  const progress = await getProgressFor(internId);
  emitToAdmins('progress:updated', { internId: String(internId), progress });
  return progress;
};

export default notify;
