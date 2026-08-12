import Notification from '../models/Notification.js';

/**
 * @route  GET /api/notifications
 * @access private
 *
 * Own notifications only — the recipient always comes from req.user, never
 * from the query string.
 */
export const getNotifications = async (req, res) => {
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));

  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(limit),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);

  res.json({ success: true, data: { notifications, unreadCount } });
};

/**
 * @route  PATCH /api/notifications/:id/read
 * @access private
 */
export const markRead = async (req, res) => {
  // Scoped by user as well as id, so one user can't mark another's as read.
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true }
  );

  if (!notification) {
    return res
      .status(404)
      .json({ success: false, message: 'Notification not found' });
  }

  const unreadCount = await Notification.countDocuments({
    user: req.user._id,
    read: false,
  });

  res.json({ success: true, data: { notification, unreadCount } });
};

/**
 * @route  PATCH /api/notifications/read-all
 * @access private
 */
export const markAllRead = async (req, res) => {
  const result = await Notification.updateMany(
    { user: req.user._id, read: false },
    { read: true }
  );

  res.json({
    success: true,
    message: 'All notifications marked as read',
    data: { updated: result.modifiedCount, unreadCount: 0 },
  });
};
