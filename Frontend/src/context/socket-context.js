import { createContext } from 'react';

/**
 * Context object in its own module so SocketContext.jsx exports only a
 * component (React Fast Refresh requirement).
 */
export const SocketContext = createContext(null);

export default SocketContext;
