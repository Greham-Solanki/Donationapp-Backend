// server.js
const mongoose = require('mongoose');
console.log('Type of connectDB:', typeof connectDB);
console.log('connectDB function:', connectDB);
require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const cors = require('cors');
const donationRoutes = require('./routes/donationRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const ChatGroup = require('./models/ChatGroup');
const Message = require('./models/Message');
const notificationRoutes = require('./routes/notificationRoutes');



const app = express();
connectDB(); // Connect to the database

app.use((req, res, next) => {
  console.log(`Received request: ${req.method} ${req.url}`);
  next();
});
// CORS options
const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api', chatRoutes);
app.use('/api', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/uploads', express.static('uploads'));


async function startServer() {
    try {
        await connectDB(); // Await the database connection
        
        // Rest of your server startup code
        const server = http.createServer(app);
        const io = socketIo(server, {
            cors: {
                origin: 'http://localhost:3000',
                credentials: true,
            }
        });
        
        // Your existing server setup continues...
        const PORT = process.env.PORT || 5000;
        server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Call the startup function
startServer();

global.io = io;

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('New client connected');

  const userId = socket.handshake.query.userId;
  socket.join(userId);

    // Handle the client joining a specific chat group
    socket.on('joinChatGroup', (chatGroupId) => {
      socket.join(chatGroupId); // Client joins a specific chat group room
      console.log(`Client joined chat group: ${chatGroupId}`);
    });

  // Send message handling
  socket.on('sendMessage', async (messageData) => {
    try {
      // Create a new message
      const newMessage = await Message.create({
        sender: messageData.sender,
        content: messageData.message,
        chatGroupId: messageData.chatGroupId,
      });

      // Add message to the chat group
      await ChatGroup.findByIdAndUpdate(
        messageData.chatGroupId,
        { $push: { messages: newMessage._id } }
      );

      // Emit the message to the connected users in the chat group
      io.to(messageData.chatGroupId).emit('messageReceived', {
        chatGroupId: messageData.chatGroupId,
        sender: messageData.sender,
        message: messageData.message,
      });
      console.log('Message sent:', messageData.message);
    } catch (err) {
      console.error('Error saving message:', err);
      socket.emit('messageError', { error: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User ${userId} disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
