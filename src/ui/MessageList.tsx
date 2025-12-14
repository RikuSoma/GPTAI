import React from 'react';
import { Message } from '../types';

interface Props {
  messages: Message[];
}

const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

export const MessageList: React.FC<Props> = ({ messages }) => (
  <ul className="message-list">
    {messages.map((message) => (
      <li key={message.id} className={`message message--${message.sender}`}>
        <div className="message__meta">
          <span className="message__sender">{message.sender === 'user' ? 'You' : 'Tutor'}</span>
          <time className="message__time">{formatTime(message.timestamp)}</time>
        </div>
        <p className="message__content">{message.content}</p>
      </li>
    ))}
  </ul>
);
