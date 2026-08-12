import api from './axios';

export const fetchInterns = async (params = {}) => {
  const { data } = await api.get('/interns', { params });
  return data.data; // { interns, pagination }
};

export const fetchIntern = async (id) => {
  const { data } = await api.get(`/interns/${id}`);
  return data.data;
};

export const createIntern = async (payload) => {
  const { data } = await api.post('/interns', payload);
  return data.data; // { intern, tempPassword }
};

export const updateIntern = async ({ id, ...payload }) => {
  const { data } = await api.put(`/interns/${id}`, payload);
  return data.data;
};

export const deleteIntern = async (id) => {
  const { data } = await api.delete(`/interns/${id}`);
  return data.data;
};

export const resetInternPassword = async (id) => {
  const { data } = await api.put(`/interns/${id}/reset-password`);
  return data.data; // { tempPassword }
};

export const fetchMyProfile = async () => {
  const { data } = await api.get('/interns/me/profile');
  return data.data;
};

export const updateMyProfile = async (payload) => {
  const { data } = await api.put('/interns/me/profile', payload);
  return data.data;
};
