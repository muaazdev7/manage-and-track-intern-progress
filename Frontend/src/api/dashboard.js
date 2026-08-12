import api from './axios';

export const fetchAdminDashboard = async () => {
  const { data } = await api.get('/dashboard/admin');
  return data.data;
};

export const fetchInternDashboard = async () => {
  const { data } = await api.get('/dashboard/intern');
  return data.data;
};
