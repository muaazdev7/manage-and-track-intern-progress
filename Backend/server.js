import 'dotenv/config';
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import connectDB from './config/db.js';
import { initSocket } from './config/socket.js';
import authRoutes from './routes/authRoutes.js';
import internRoutes from './routes/internRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

await connectDB();

const app = express();

// CORS must be mounted before the routes, and needs credentials:true
// so the browser will send/accept the httpOnly JWT cookie.
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/interns', internRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);

// Must stay last — order matters.
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
/**
 * Express and Socket.IO share one HTTP server.
 *
 * The listen call MUST be on httpServer, not app — app.listen() creates a
 * second, separate server that Socket.IO is not attached to, and every
 * websocket handshake then fails or silently falls back to polling.
 */
const httpServer = http.createServer(app);

initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log('Socket.IO ready');
});
