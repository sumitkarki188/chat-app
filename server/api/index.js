const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Updated CORS configuration for production
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:3000", 
      "https://*.onrender.com",
      "https://chat-app-ihy3.onrender.com",
      "https://*.vercel.app",
      "https://*.netlify.app"
    ],
    methods: ["GET", "POST"],
    credentials: true,
    allowEIO3: true
  }
});

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://*.onrender.com", 
    "https://chat-app-ihy3.onrender.com",
    "https://*.vercel.app",
    "https://*.netlify.app"
  ],
  credentials: true
}));

// Middleware for JSON parsing
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'Chat server is running!',
    timestamp: new Date().toISOString(),
    connectedUsers: connectedUsers.size
  });
});

// API endpoint to get server info
app.get('/api/info', (req, res) => {
  res.json({
    server: 'Chat Server',
    version: '1.0.0',
    onlineUsers: Array.from(connectedUsers.values()),
    totalMessages: chatMessages.length
  });
});

let chatMessages = [];
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('New connection:', socket.id);

  socket.on('join-chat', (username) => {
    console.log(`${username} joined the chat`);
    socket.username = username;
    connectedUsers.set(socket.id, username);
    
    // Send chat history to the new user
    socket.emit('chat-history', chatMessages);
    
    // Update online users list
    const onlineUsers = Array.from(connectedUsers.values());
    io.emit('online-users', onlineUsers);
    
    // Notify others that user joined
    socket.broadcast.emit('user-joined', {
      username: username,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('send-message', (messageData) => {
    console.log('Received message:', messageData);
    
    const message = {
      ...messageData,
      serverTimestamp: new Date().toISOString(),
      id: Date.now().toString() // Add unique ID for each message
    };
    
    chatMessages.push(message);
    
    // Keep only last 100 messages to prevent memory issues
    if (chatMessages.length > 100) {
      chatMessages = chatMessages.slice(-100);
    }
    
    // Broadcast message to all connected clients
    io.emit('new-message', message);
  });

  socket.on('typing', (data) => {
    // Broadcast typing indicator to all other users
    socket.broadcast.emit('user-typing', {
      username: data.username,
      isTyping: data.isTyping
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const username = connectedUsers.get(socket.id);
    
    if (username) {
      connectedUsers.delete(socket.id);
      
      // Update online users list
      const onlineUsers = Array.from(connectedUsers.values());
      io.emit('online-users', onlineUsers);
      
      // Notify others that user left
      socket.broadcast.emit('user-left', {
        username: username,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Chat server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready for connections`);
  console.log(`🌐 Server URL: https://chat-app-ihy3.onrender.com`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Export for testing
module.exports = server;
