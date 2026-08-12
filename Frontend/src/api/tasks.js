import api from './axios';

export const fetchTasks = async (params = {}) => {
  const { data } = await api.get('/tasks', { params });
  return data.data; // { tasks, counts }
};

export const fetchMyTasks = async (params = {}) => {
  const { data } = await api.get('/tasks/my', { params });
  return data.data; // { tasks, counts }
};

export const fetchTask = async (id) => {
  const { data } = await api.get(`/tasks/${id}`);
  return data.data;
};

export const createTask = async (payload) => {
  const { data } = await api.post('/tasks', payload);
  return data.data; // array of created tasks
};

export const updateTask = async ({ id, ...payload }) => {
  const { data } = await api.put(`/tasks/${id}`, payload);
  return data.data;
};

export const deleteTask = async (id) => {
  const { data } = await api.delete(`/tasks/${id}`);
  return data.data;
};

/** The only transition an intern may make: pending → in-progress. */
export const startTask = async (id) => {
  const { data } = await api.patch(`/tasks/${id}/status`, {
    status: 'in-progress',
  });
  return data.data;
};
