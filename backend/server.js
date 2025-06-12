import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';

// --- Import all route handlers ---
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import collaborationRoutes from './routes/collaborationRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import taskRoutes from './routes/taskRoutes.js';

import { handleSocketConnection } from './controllers/notificationController.js';

// --- Basic Setup ---
dotenv.config();
connectDB();
const app = express();

// --- Middleware ---
// Use CORS for allowing requests from your frontend
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
// Middleware to parse JSON bodies
app.use(express.json());

// --- API Route Registration ---
// All your API endpoints are defined here
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/chat', chatRoutes);

// *** FIX: Corrected '/api/collaborations' to '/api/collaboration' to match frontend services ***
app.use('/api/collaborations', collaborationRoutes);


// --- Root Route for Health Check ---
app.get('/', (req, res) => {
  res.send('CollabSphere API is running successfully.');
});

// --- HTTP and Socket.IO Server Setup ---
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// --- Socket.IO Connection Handling ---
export const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Register user with their socket ID for direct messaging
  socket.on('registerUser', (userId) => {
    if (userId) {
      activeUsers.set(socket.id, userId);
      socket.join(userId); // User joins a room named after their own ID
      console.log(`User ${userId} registered with socket ${socket.id}`);
    }
  });

  // Handle joining/leaving project chat rooms
  socket.on('joinChatRoom', (chatRoomId) => {
    socket.join(chatRoomId);
    console.log(`User ${activeUsers.get(socket.id)} joined chat room ${chatRoomId}`);
  });
  socket.on('leaveChatRoom', (chatRoomId) => {
    socket.leave(chatRoomId);
    console.log(`User ${activeUsers.get(socket.id)} left chat room ${chatRoomId}`);
  });

  // Pass socket to notification handler for real-time notifications
  handleSocketConnection(io, socket);

  // Handle user disconnection
  socket.on('disconnect', () => {
    const userId = activeUsers.get(socket.id);
    if (userId) {
      console.log(`User ${userId} (socket ${socket.id}) disconnected`);
      activeUsers.delete(socket.id);
    } else {
      console.log('An unregistered user disconnected:', socket.id);
    }
  });
});

// Export 'io' so it can be used in other parts of the app (like controllers)
export { io }; 

// --- Start Server ---
const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`));