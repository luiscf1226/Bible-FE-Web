'use client';

import { RefObject } from 'react';
import styles from './ChatMessages.module.css';

export interface Message {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  verse?: string;
  devotional?: string;
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  messagesEndRef?: RefObject<HTMLDivElement>;
}

export default function ChatMessages({ messages, isLoading, messagesEndRef }: ChatMessagesProps) {
  return (
    <div className={styles.messages}>
      {messages.map((message, index) => (
        <div
          key={index}
          className={`${styles.message} ${
            message.sender === 'user' ? styles.userMessage : styles.botMessage
          }`}
        >
          <div className={styles.messageContent}>{message.text}</div>
          {message.verse && (
            <div className={styles.verse}>
              <p>{message.verse}</p>
            </div>
          )}
          {message.devotional && (
            <div className={styles.devotional}>
              <p>{message.devotional}</p>
            </div>
          )}
          <div className={styles.messageTimestamp}>
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      ))}
      {isLoading && (
        <div className={`${styles.message} ${styles.botMessage}`}>
          <div className={styles.messageContent}>
            <div className={styles.typingIndicator}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
} 