const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
// server.js - Update the CORS origins
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173", "https://your-frontend-url.com"],
    methods: ["GET", "POST"],
    credentials: true
  }
});


app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  credentials: true
}));

// Store chat messages and connected users
let chatMessages = [];
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('New connection:', socket.id);

  socket.on('join-chat', (username) => {
    console.log(`${username} joined the chat`);
    
    // Store user info
    socket.username = username;
    connectedUsers.set(socket.id, username);
    
    // Send chat history to the new user
    socket.emit('chat-history', chatMessages);
    
    // Update online users list
    const onlineUsers = Array.from(connectedUsers.values());
    io.emit('online-users', onlineUsers);
    
    // Notify all users about the new user (except the user who just joined)
    socket.broadcast.emit('user-joined', {
      username: username,
      timestamp: new Date().toISOString()
    });
    
    console.log('Online users:', onlineUsers);
  });

  socket.on('send-message', (messageData) => {
    console.log('Received message:', messageData);
    
    // Add server timestamp
    const message = {
      ...messageData,
      serverTimestamp: new Date().toISOString()
    };
    
    // Store message in chat history
    chatMessages.push(message);
    
    // Keep only last 100 messages to prevent memory issues
    if (chatMessages.length > 100) {
      chatMessages = chatMessages.slice(-100);
    }
    
    // Broadcast message to all connected clients
    io.emit('new-message', message);
    
    console.log('Message broadcasted to all clients');
    console.log('Total messages in history:', chatMessages.length);
  });

  socket.on('leave-chat', (username) => {
    console.log(`${username} is leaving the chat`);
    handleUserDisconnect(socket);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    handleUserDisconnect(socket);
  });

  function handleUserDisconnect(socket) {
    const username = connectedUsers.get(socket.id);
    if (username) {
      connectedUsers.delete(socket.id);
      
      // Update online users list
      const onlineUsers = Array.from(connectedUsers.values());
      io.emit('online-users', onlineUsers);
      
      // Notify remaining users
      socket.broadcast.emit('user-left', {
        username: username,
        timestamp: new Date().toISOString()
      });
      
      console.log(`${username} left. Online users:`, onlineUsers);
    }
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Chat server running on port ${PORT}`);
  console.log(`Socket.IO server ready for connections`);
  console.log(`Accepting connections from: http://localhost:3000 and http://localhost:5173`);
});
