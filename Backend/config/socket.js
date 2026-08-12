import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

import User from '../models/User.js';

let io = null;

/**
 * Minimal cookie-header parser. The handshake is a raw HTTP upgrade, so
 * cookie-parser (Express middleware) never runs on it.
 */
const parseCookies = (header = '') =>
  header.split(';').reduce((jar, part) => {
    const index = part.indexOf('=');
    if (index === -1) return jar;
    jar[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
    return jar;
  }, {});

/**
 * Create the Socket.IO server and bind it to the existing HTTP server.
 *
 * Authentication reuses the same httpOnly JWT cookie as the REST API — an
 * unauthenticated or expired token is rejected at the handshake, so no socket
 * ever exists without a known user behind it.
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const { token } = parseCookies(socket.handshake.headers?.cookie);

      if (!token) return next(new Error('Not authorized'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id name role');

      if (!user) return next(new Error('User no longer exists'));

      socket.user = { id: String(user._id), name: user.name, role: user.role };
      next();
    } catch {
      next(new Error('Not authorized'));
    }
  });

  io.on('connection', (socket) => {
    // Personal room — everything addressed to one person goes here.
    socket.join(`user:${socket.user.id}`);

    // Admins additionally share a room for queue/progress broadcasts.
    if (socket.user.role === 'admin') socket.join('admins');

    if (process.env.NODE_ENV !== 'production') {
      console.log(`socket connected: ${socket.user.name} (${socket.user.role})`);
    }
  });

  return io;
};

/**
 * Accessor for the controllers. Returns null before initSocket runs, so
 * emit helpers can no-op safely (scripts like seed.js have no socket server).
 */
export const getIO = () => io;

/** Emit to one user's personal room. */
export const emitToUser = (userId, event, payload) => {
  io?.to(`user:${userId}`).emit(event, payload);
};

/** Emit to every connected admin. */
export const emitToAdmins = (event, payload) => {
  io?.to('admins').emit(event, payload);
};

export default initSocket;
