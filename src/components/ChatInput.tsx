'use client';

import { useState } from 'react';
import styles from './ChatInput.module.css';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  theme?: {
    accent: string;
    border: string;
  };
}

export default function ChatInput({ onSendMessage, disabled = false, theme }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.inputContainer}>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Escribe tu mensaje..."
        className={styles.input}
        disabled={disabled}
      />
      <button 
        type="submit" 
        className={styles.sendButton}
        disabled={!message.trim() || disabled}
        style={theme ? {
          background: theme.accent,
          borderColor: theme.border
        } : undefined}
      >
        Enviar
      </button>
    </form>
  );
} 