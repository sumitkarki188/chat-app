import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style.css';
import ChatList from './ChatList';
import InputText from './InputText';
import socketIoClient from 'socket.io-client';

const ChatContainer = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/');
    } else {
      setUser(storedUser);
    }
  }, [navigate]);

  useEffect(() => {
    if (user) {
      console.log('Connecting user:', user);
      const socketConnection = socketIoClient('http://localhost:3001', {
        transports: ['websocket', 'polling'],
        timeout: 20000,
      });
      setSocket(socketConnection);

      // Connection status handlers
      socketConnection.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
        socketConnection.emit('join-chat', user);
      });

      socketConnection.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
      });

      socketConnection.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setIsConnected(false);
      });

      // Listen for chat history
      socketConnection.on('chat-history', (history) => {
        console.log('Received chat history:', history);
        setMessages(history);
      });

      // Listen for new messages
      socketConnection.on('new-message', (message) => {
        console.log('Received new message:', message);
        setMessages(prevMessages => {
          const exists = prevMessages.some(msg => msg.id === message.id);
          if (!exists) {
            return [...prevMessages, message];
          }
          return prevMessages;
        });
      });

      // Listen for online users
      socketConnection.on('online-users', (users) => {
        console.log('Online users:', users);
        setOnlineUsers(users);
      });

      // Listen for user joined
      socketConnection.on('user-joined', (data) => {
        console.log('User joined:', data);
        const systemMessage = {
          id: `system-${Date.now()}`,
          text: `${data.username} joined the chat`,
          sender: "system",
          username: "System",
          timestamp: new Date().toISOString(),
          avatar: `https://picsum.photos/seed/system/40/40`
        };
        setMessages(prev => [...prev, systemMessage]);
      });

      // Listen for user left
      socketConnection.on('user-left', (data) => {
        console.log('User left:', data);
        const systemMessage = {
          id: `system-${Date.now()}`,
          text: `${data.username} left the chat`,
          sender: "system",
          username: "System",
          timestamp: new Date().toISOString(),
          avatar: `https://picsum.photos/seed/system/40/40`
        };
        setMessages(prev => [...prev, systemMessage]);
      });

      return () => {
        socketConnection.emit('leave-chat', user);
        socketConnection.disconnect();
      };
    }
  }, [user]);

  const sendMessage = (messageText) => {
    if (messageText.trim() && socket && user && isConnected) {
      const messageData = {
        id: `${user}-${Date.now()}`,
        text: messageText.trim(),
        sender: user,
        username: user,
        timestamp: new Date().toISOString(),
        avatar: `https://picsum.photos/seed/${encodeURIComponent(user)}_avatar/40/40`
      };

      console.log('Sending message:', messageData);
      socket.emit('send-message', messageData);
    } else if (!isConnected) {
      alert('Not connected to server. Please wait...');
    }
  };

  const handleLogout = () => {
    if (socket) {
      socket.emit('leave-chat', user);
      socket.disconnect();
    }
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="chats_header">
        <div>
          <span className="chat_icon">💬</span>
          <span style={{ marginLeft: '10px', fontSize: '18px', fontWeight: 'bold' }}>
            Welcome, {user}!
          </span>
          <span style={{ 
            marginLeft: '10px', 
            fontSize: '12px', 
            color: isConnected ? 'green' : 'red',
            fontWeight: 'bold'
          }}>
            {isConnected ? '🟢 Online' : '🔴 Offline'}
          </span>
        </div>
        <div>
          <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
            Online: {onlineUsers.length} users | Chats are end to end secure
          </p>
        </div>
        <div className="logout-btn" onClick={handleLogout}>
          <strong>Logout</strong>
        </div>
      </div>
      
      <ChatList messages={messages} currentUser={user} />
      <InputText onSendMessage={sendMessage} disabled={!isConnected} />
    </div>
  );
};

export default ChatContainer;
