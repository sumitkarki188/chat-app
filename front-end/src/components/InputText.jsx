import React, { useState } from 'react';
import '../style.css';

const InputText = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    console.log('Sending message:', message);
    if (message.trim() && onSendMessage && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="Messagebox">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={disabled ? "Connecting..." : "Type a message..."}
        rows="1"
        disabled={disabled}
      />
      <button onClick={handleSend} disabled={disabled || !message.trim()}>
        Send
      </button>
    </div>
  );
};

export default InputText;
