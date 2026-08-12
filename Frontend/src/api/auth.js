import api from './axios';

export const loginRequest = async (credentials) => {
  const { data } = await api.post('/auth/login', credentials);
  return data.data;
};

export const logoutRequest = async () => {
  const { data } = await api.post('/auth/logout');
  return data;
};

export const getMeRequest = async () => {
  const { data } = await api.get('/auth/me');
  return data.data;
};

export const changePasswordRequest = async (payload) => {
  const { data } = await api.put('/auth/change-password', payload);
  return data;
};
