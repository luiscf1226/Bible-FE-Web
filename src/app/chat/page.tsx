'use client';

import { useState, useRef, useEffect } from 'react';
import { sendFeelingMessage } from '@/services/feelingChat';
import { useUserName } from '@/contexts/UserNameContext';
import { useRateLimit } from '@/contexts/RateLimitContext';
import ChatMessages from '@/components/ChatMessages';
import ChatInput from '@/components/ChatInput';
import RateLimitAlert from '@/components/RateLimitAlert';
import styles from './chat.module.css';

const feelings = [
  { text: 'Alegría', emoji: '😊' },
  { text: 'Tristeza', emoji: '😢' },
  { text: 'Enojo', emoji: '😠' },
  { text: 'Miedo', emoji: '😨' },
  { text: 'Ansiedad', emoji: '😰' },
  { text: 'Esperanza', emoji: '✨' },
  { text: 'Gratitud', emoji: '🙏' },
  { text: 'Paz', emoji: '🕊️' },
  { text: 'Confusión', emoji: '🤔' },
  { text: 'Duda', emoji: '❓' }
];

type Message = {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  verse?: string;
  devotional?: string;
};

type FeelingResponse = {
  verse?: string;
  devotional?: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userName } = useUserName();
  const { showRateLimitAlert, rateLimitInfo, setShowRateLimitAlert, setRateLimitInfo } = useRateLimit();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: "smooth",
      block: "end"
    });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    if (!selectedFeeling) {
      setError('Por favor, selecciona un sentimiento antes de enviar un mensaje');
      return;
    }

    if (!userName) {
      setError('Por favor, ingresa tu nombre para continuar');
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      
      // Add user message
      const userMessage: Message = {
        text: message,
        sender: 'user',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);

      // Get response from API
      const response = await sendFeelingMessage(message, selectedFeeling, userName);
      
      // Add assistant message
      const assistantMessage: Message = {
        text: response.devotional || '',
        sender: 'bot',
        timestamp: new Date(),
        verse: response.verse,
        devotional: response.devotional
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      if (error.message.includes('Rate limit exceeded')) {
        setRateLimitInfo({
          remainingTime: '24 horas',
          endpoint: 'feelingChat'
        });
        setShowRateLimitAlert(true);
      } else {
        setError('Error al enviar el mensaje. Por favor, intenta de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <RateLimitAlert
        showRateLimitAlert={showRateLimitAlert}
        rateLimitInfo={rateLimitInfo}
        onClose={() => {
          setShowRateLimitAlert(false);
          setRateLimitInfo(null);
        }}
      />
      <div className={styles.chatContainer}>
        <div className={styles.header}>
          <h1>¿Cómo te sientes hoy?</h1>
          <div className={styles.feelingSelector}>
            {feelings.map((feeling) => (
              <button
                key={feeling.text}
                className={`${styles.feelingButton} ${selectedFeeling === feeling.text ? styles.selected : ''}`}
                onClick={() => setSelectedFeeling(feeling.text)}
              >
                <span className={styles.emoji}>{feeling.emoji}</span>
                <span className={styles.feelingText}>{feeling.text}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <p>{error}</p>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        <ChatMessages 
          messages={messages} 
          isLoading={isLoading}
          messagesEndRef={messagesEndRef}
        />
        
        <ChatInput 
          onSendMessage={handleSendMessage} 
          disabled={isLoading || !selectedFeeling}
        />
      </div>
    </div>
  );
} 