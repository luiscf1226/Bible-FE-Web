'use client';

import { RefObject, useMemo } from 'react';
import styles from './ChatMessages.module.css';
import { Message } from '@/types/chat';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  messagesEndRef: RefObject<HTMLDivElement>;
  onSpeak: (text: string) => void;
  isSpeaking: boolean;
  onStopSpeaking: () => void;
}

export default function ChatMessages({ 
  messages, 
  isLoading, 
  messagesEndRef,
  onSpeak,
  isSpeaking,
  onStopSpeaking
}: ChatMessagesProps) {
  // Deduplicate messages based on ID and content
  const uniqueMessages = useMemo(() => {
    const seen = new Set<string>();
    return messages.filter(message => {
      // Create a unique key combining ID and content
      const messageKey = `${message.id}-${message.text}-${message.verse}-${message.devotional}`;
      if (seen.has(messageKey)) {
        console.log('Duplicate message detected:', messageKey);
        return false;
      }
      seen.add(messageKey);
      return true;
    });
  }, [messages]);

  console.log('Original messages count:', messages.length);
  console.log('Unique messages count:', uniqueMessages.length);

  return (
    <div className={styles.messages}>
      {uniqueMessages.map((message) => (
        <div
          key={`${message.id}-${message.timestamp.getTime()}`}
          className={`${styles.message} ${
            message.sender === 'user' ? styles.userMessage : styles.botMessage
          }`}
        >
          {message.sender === 'bot' && (
            <div className={styles.speechControls}>
              <button
                onClick={() => isSpeaking ? onStopSpeaking() : onSpeak(message.text)}
                className={styles.speechButton}
                title={isSpeaking ? "Detener" : "Escuchar"}
              >
                {isSpeaking ? '🔇' : '🔊'}
              </button>
            </div>
          )}
          <div className={styles.messageContent}>
            {message.verse && (
              <div className={styles.verse}>
                <p>{message.verse}</p>
              </div>
            )}
            {!message.devotional && <p>{message.text}</p>}
            {message.devotional && (
              <div className={styles.devotional}>
                <p>{message.devotional}</p>
              </div>
            )}
            <span className={styles.messageTimestamp}>
              {message.timestamp.toLocaleTimeString()}
            </span>
          </div>
        </div>
      ))}
      {isLoading && (
        <div className={`${styles.message} ${styles.botMessage}`}>
          <div className={styles.loadingDots}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
} 