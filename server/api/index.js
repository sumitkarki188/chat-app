const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:5173", "https://*.vercel.app", "https://*.render.com"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: ["http://localhost:5173", "https://*.vercel.app", "https://*.render.com"],
  credentials: true
}));

// Add a basic route for health check
app.get('/', (req, res) => {
  res.send('Chat server is running!');
});

let chatMessages = [];
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('New connection:', socket.id);

  socket.on('join-chat', (username) => {
    console.log(`${username} joined the chat`);
    socket.username = username;
    connectedUsers.set(socket.id, username);
    socket.emit('chat-history', chatMessages);
    const onlineUsers = Array.from(connectedUsers.values());
    io.emit('online-users', onlineUsers);
    socket.broadcast.emit('user-joined', {
      username: username,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('send-message', (messageData) => {
    console.log('Received message:', messageData);
    const message = {
      ...messageData,
      serverTimestamp: new Date().toISOString()
    };
    chatMessages.push(message);
    if (chatMessages.length > 100) {
      chatMessages = chatMessages.slice(-100);
    }
    io.emit('new-message', message);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const username = connectedUsers.get(socket.id);
    if (username) {
      connectedUsers.delete(socket.id);
      const onlineUsers = Array.from(connectedUsers.values());
      io.emit('online-users', onlineUsers);
      socket.broadcast.emit('user-left', {
        username: username,
        timestamp: new Date().toISOString()
      });
    }
  });
});

// CRITICAL: Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export for testing (optional)
module.exports = server;
