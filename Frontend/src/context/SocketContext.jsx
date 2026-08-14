import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

import useAuth from '../hooks/useAuth';
import SocketContext from './socket-context';
import { SOCKET_URL } from '../api/config';

/**
 * Owns the single Socket.IO connection for the session.
 *
 * The instance is created once (lazily, on first render) with
 * `autoConnect: false`; the effect then only opens and closes it. That keeps
 * the effect a pure external-system sync — no state is written from inside it.
 *
 * The URL comes from VITE_API_URL (see api/config.js); when it is unset the
 * client connects same-origin through the Vite proxy. Either way the browser
 * sends the httpOnly JWT cookie itself — which is exactly what the server's
 * handshake middleware verifies.
 */
export const SocketProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  const [socket] = useState(() =>
    io(SOCKET_URL, {
      autoConnect: false,
      withCredentials: true,
      // Start on polling so the cookie is present on the handshake, then let
      // Socket.IO upgrade to websocket.
      transports: ['polling', 'websocket'],
    })
  );

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    socket.connect();

    // Disconnecting on unmount (and on logout, or if the account changes) is
    // what stops a stale session leaving a live socket behind. Reconnecting
    // also re-runs the handshake, so the new identity's cookie is verified.
    return () => {
      socket.disconnect();
    };
  }, [socket, isAuthenticated, user?._id]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export default SocketProvider;
