import axios from 'axios';

import { API_BASE_URL } from './config';

/**
 * VITE_API_URL is the backend ORIGIN (http://localhost:5000). Every route is
 * mounted under /api, so the base must include it — using the bare origin
 * turns POST /auth/login into a 404.
 * withCredentials is what makes the browser send the httpOnly JWT cookie.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
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
