// // server.js
require('dotenv').config();
const cors = require('cors');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const donationRoutes = require('./routes/donationRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const ChatGroup = require('./models/ChatGroup');
const Message = require('./models/Message');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
connectDB(); // Connect to the database -

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  next();
});

// CORS options
const corsOptions = {
  origin: ['https://dt4vllf2wq2hs.cloudfront.net',
    'https://giveawaycommunity.dedyn.io',
    'https://wwww.giveawaycommunity.dedyn.io',
    'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api', chatRoutes);
app.use('/api', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/uploads', express.static('uploads'));

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Make io globally accessible
global.io = io;

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('✅ New client connected:', socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    socket.join(userId);
    console.log(`👤 User ${userId} joined personal room`);
  }

  // Handle joining a specific chat group
  socket.on('joinChatGroup', (chatGroupId) => {
    socket.join(chatGroupId);
    console.log(`📱 Socket ${socket.id} joined chat group: ${chatGroupId}`);
  });

  // Handle leaving a chat group
  socket.on('leaveChatGroup', (chatGroupId) => {
    socket.leave(chatGroupId);
    console.log(`👋 Socket ${socket.id} left chat group: ${chatGroupId}`);
  });

  // Handle sending messages (SIMPLIFIED - just broadcast, don't save here)
  socket.on('sendMessage', (messageData) => {
    try {
      console.log('📨 Broadcasting message to room:', messageData.chatGroupId);

      // IMPORTANT: Just broadcast the message that was already saved via API
      // Don't create it again here - that causes duplicates
      io.to(messageData.chatGroupId).emit('messageReceived', {
        _id: messageData._id,
        chatGroupId: messageData.chatGroupId,
        sender: messageData.sender,
        content: messageData.content,
        createdAt: messageData.createdAt || new Date(),
      });

      console.log('✅ Message broadcast to all users in room');
    } catch (err) {
      console.error('❌ Error broadcasting message:', err);
      socket.emit('messageError', { error: 'Failed to broadcast message' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ User ${userId || 'unknown'} disconnected:`, socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));