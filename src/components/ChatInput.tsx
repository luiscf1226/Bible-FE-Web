'use client';

import { useState, useEffect } from 'react';
import styles from './ChatInput.module.css';
import { useTranslation } from '@/hooks/useTranslation';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  theme?: {
    accent: string;
    border: string;
  };
  placeholder?: string;
  speechRecognition?: React.ReactNode;
  transcript?: string;
}

export default function ChatInput({ 
  onSendMessage, 
  disabled = false, 
  theme, 
  placeholder = "Escribe tu mensaje...",
  speechRecognition,
  transcript = ''
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const { t } = useTranslation();

  // Update message when transcript changes
  useEffect(() => {
    if (transcript) {
      setMessage(transcript);
    }
  }, [transcript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.inputContainer}>
      <div className={styles.inputWrapper}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder}
          className={styles.input}
          disabled={disabled}
        />
        {speechRecognition}
      </div>
      <button 
        type="submit" 
        className={styles.sendButton}
        disabled={!message.trim() || disabled}
        style={theme ? {
          background: theme.accent,
          borderColor: theme.border
        } : undefined}
      >
        {t('chatInput.send')}
      </button>
    </form>
  );
} 