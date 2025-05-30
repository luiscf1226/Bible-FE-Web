'use client';

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
}

export default function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  return (
    <div className={styles.messagesContainer}>
      {messages.map((message, index) => (
        <div
          key={index}
          className={`${styles.message} ${
            message.sender === 'user' ? styles.userMessage : styles.botMessage
          }`}
        >
          {message.sender === 'bot' && message.verse && (
            <div className={styles.verse}>
              <strong>Versículo:</strong> {message.verse}
            </div>
          )}
          <div className={styles.messageContent}>{message.text}</div>
          <div className={styles.timestamp}>
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      ))}
      {isLoading && (
        <div className={`${styles.message} ${styles.botMessage}`}>
          <div className={styles.typingIndicator}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}
    </div>
  );
} 