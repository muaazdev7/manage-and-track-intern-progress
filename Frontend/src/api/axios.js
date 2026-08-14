import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const currentPath = window.location.pathname;

    // A 401 means the cookie is missing or expired — bounce to login.
    // Exclude /auth/me: AuthContext calls it on every mount to test whether
    // a session exists, and a 401 there is the expected "not logged in"
    // answer, not a session that just died.
    const isSessionCheck = error.config?.url?.includes('/auth/me');

    if (status === 401 && !isSessionCheck && currentPath !== '/login') {
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

/** Pull the server's message out of an axios error for display. */
export const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || 'Something went wrong';

export default api;
