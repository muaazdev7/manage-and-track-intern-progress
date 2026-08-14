/**
 * Single source of truth for the backend's location.
 *
 * `VITE_API_URL` is the backend origin only — no `/api` suffix, no trailing
 * slash (either is tolerated and normalised below). Everything that talks to
 * the backend derives its URL from here: the axios instance, the Socket.IO
 * connection, and attachment download links.
 *
 *   development   VITE_API_URL=http://localhost:5000
 *   production    set it in the Vercel dashboard, e.g.
 *                 VITE_API_URL=https://interntrack-api.onrender.com
 *
 * If the variable is unset, everything falls back to same-origin relative
 * paths, which is what the Vite dev proxy serves. That keeps the app working
 * out of the box for anyone who clones it without writing a .env first.
 *
 * Note: Vite inlines import.meta.env at BUILD time, so changing this value
 * on Vercel requires a redeploy, not just an env-var edit.
 */

const rawApiUrl = import.meta.env.VITE_API_URL ?? '';

/** Backend origin with any trailing slashes removed. '' means same-origin. */
export const API_URL = rawApiUrl.trim().replace(/\/+$/, '');

/** Base for every REST call, e.g. 'http://localhost:5000/api' or '/api'. */
export const API_BASE_URL = `${API_URL}/api`;

/**
 * Where Socket.IO connects. `undefined` tells socket.io-client to use the
 * page's own origin, which the Vite proxy forwards.
 */
export const SOCKET_URL = API_URL || undefined;

export default API_URL;
