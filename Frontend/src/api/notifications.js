import api from './axios';

export const fetchNotifications = async () => {
  const { data } = await api.get('/notifications');
  return data.data; // { notifications, unreadCount }
};

export const markNotificationRead = async (id) => {
  const { data } = await api.patch(`/notifications/${id}/read`);
  return data.data;
};

export const markAllNotificationsRead = async () => {
  const { data } = await api.patch('/notifications/read-all');
  return data.data;
};
