import React from 'react';
import '../style.css';

const ChatList = ({ messages, currentUser }) => {
  console.log('ChatList rendering with messages:', messages);
  console.log('Current user:', currentUser);

  const generateAvatarUrl = (seed) => {
    return `https://picsum.photos/seed/${encodeURIComponent(seed)}/40/40`;
  };

  return (
    <div className="chat-container">
      {messages.map((message) => {
        const isMyMessage = message.sender === currentUser || message.username === currentUser;
        const isSystemMessage = message.sender === "system";
        
        return (
          <div 
            key={message.id} 
            className={`chat ${
              isSystemMessage 
                ? 'system-message' 
                : isMyMessage 
                  ? 'receiver' 
                  : 'sender'
            }`}
            style={isSystemMessage ? {
              textAlign: 'center',
              margin: '10px 0',
              opacity: 0.7,
              fontSize: '14px'
            } : {}}
          >
            {!isSystemMessage && (
              <img 
                src={message.avatar || generateAvatarUrl(message.username + '_avatar')} 
                alt="User" 
              />
            )}
            <div className={`chat-bubble ${isSystemMessage ? 'system-bubble' : ''}`}>
              <div className="message-text">{message.text}</div>
              {!isSystemMessage && message.username && (
                <div className="message-username" style={{ 
                  fontSize: '12px', 
                  opacity: '0.7', 
                  marginTop: '4px',
                  fontWeight: 'bold'
                }}>
                  {message.username}
                </div>
              )}
              {message.timestamp && (
                <div className="message-timestamp" style={{ 
                  fontSize: '10px', 
                  opacity: '0.5', 
                  marginTop: '2px' 
                }}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ChatList;
