import axios from 'axios';

/**
 * baseURL is the relative '/api' so the Vite dev proxy handles it.
 * withCredentials is what makes the browser send the httpOnly JWT cookie.
 */
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
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
