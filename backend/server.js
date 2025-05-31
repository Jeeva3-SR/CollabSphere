import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import collaborationRoutes from './routes/collaborationRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

import { handleSocketConnection } from './controllers/notificationController.js'; // For socket handling

dotenv.config();
connectDB();

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/collaborations', collaborationRoutes);
app.use('/api/notifications', notificationRoutes);
if (chatRoutes) {
  app.use('/api/chat', chatRoutes); 
}

app.get('/', (req, res) => {
  res.send('CollabSphere API Running');
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Store active users (socketId -> userId)
export const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('registerUser', (userId) => {
    if (userId) {
      activeUsers.set(socket.id, userId);
      socket.join(userId); // Join a room with their userId
      console.log(`User ${userId} registered with socket ${socket.id}`);
      console.log('Active users:', Array.from(activeUsers.values()));
    }
  });
  // In backend server.js io.on('connection', ...)
socket.on('joinChatRoom', (chatRoomId) => {
    socket.join(chatRoomId); // Socket.IO room feature
    console.log(`User ${activeUsers.get(socket.id)} joined chat room ${chatRoomId}`);
    // Optionally, emit an event to the room that a user has joined
    // io.to(chatRoomId).emit('userJoinedChat', { userId: activeUsers.get(socket.id), userName: '...' });
});
socket.on('leaveChatRoom', (chatRoomId) => {
    socket.leave(chatRoomId);
    console.log(`User ${activeUsers.get(socket.id)} left chat room ${chatRoomId}`);
});

  handleSocketConnection(io, socket); // Pass io and socket to controller if needed for specific emits

  socket.on('disconnect', () => {
    const userId = activeUsers.get(socket.id);
    if (userId) {
      console.log(`User ${userId} (socket ${socket.id}) disconnected`);
    } else {
      console.log('User disconnected:', socket.id);
    }
    activeUsers.delete(socket.id);
    console.log('Active users:', Array.from(activeUsers.values()));
  });
});

export { io }; // Export io to be used in controllers

const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));