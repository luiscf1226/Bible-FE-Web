'use client';

import { useEffect, useRef } from 'react';
import styles from './ChatMessages.module.css';
import MuteButton from './MuteButton';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  verse?: string;
  devotional?: string;
  svg?: string;
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onSpeak: (text: string) => void;
  isSpeaking: boolean;
  onStopSpeaking: () => void;
  theme?: {
    accent: string;
    border: string;
  };
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isLoading,
  messagesEndRef,
  onSpeak,
  isSpeaking,
  onStopSpeaking,
  theme
}) => {
  return (
    <div className={styles.messagesContainer}>
      {messages.map((message) => (
        <div
          key={message.id}
          className={`${styles.message} ${
            message.sender === 'user' ? styles.userMessage : styles.botMessage
          }`}
          style={message.sender === 'bot' && theme ? { borderColor: theme.border } : undefined}
        >
          <div className={styles.messageContent}>
            {message.verse && (
              <div className={styles.verse}>
                <p>{message.verse}</p>
              </div>
            )}
            <p>{message.text}</p>
            {message.svg && (
              <div 
                className={styles.svgContainer}
                dangerouslySetInnerHTML={{ __html: message.svg }}
              />
            )}
          </div>
          {message.sender === 'bot' && (
            <div className={styles.messageActions}>
              <MuteButton
                isSpeaking={isSpeaking}
                onToggle={() => isSpeaking ? onStopSpeaking() : onSpeak(message.text)}
                className={styles.speakButton}
                style={theme ? {
                  background: theme.accent,
                  borderColor: theme.border
                } : undefined}
              />
            </div>
          )}
        </div>
      ))}
      {isLoading && (
        <div className={styles.loadingMessage}>
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
};

export default ChatMessages; 