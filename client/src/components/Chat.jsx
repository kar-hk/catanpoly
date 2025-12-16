import { useState, useRef, useEffect } from 'react';
import './Chat.css';

function Chat({ messages, onSend, onClose }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input.trim());
      setInput('');
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3>💬 Chat</h3>
        <button className="close-chat" onClick={onClose}>×</button>
      </div>
      
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="no-messages">No messages yet</div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className="chat-message">
            <span 
              className="message-author"
              style={{ color: msg.playerColor }}
            >
              {msg.playerName}:
            </span>
            <span className="message-text">{msg.message}</span>
            <span className="message-time">{formatTime(msg.timestamp)}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          maxLength={200}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default Chat;

